import { Stack, Paper, Title, Group, Button, Text, Grid, Table } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFileDescription, IconDownload } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserSettings } from '../services/firestore';
import type { ServiceEntry } from '../types';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserRole } from '../types';
import { formatTimeHours } from '../utils/formatUtils';

dayjs.locale('it');

interface ReportViewProps {
    entries: ServiceEntry[];
}

export default function ReportView({ entries }: ReportViewProps) {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([dayjs().startOf('month').toDate(), dayjs().endOf('month').toDate()]);
    const [rolesMap, setRolesMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToUserSettings(user.uid, (settings) => {
            setRolesMap(settings.monthlyRoles || {});
        });
        return () => unsubscribe();
    }, [user]);

    const formatRoleName = (roleVal: string) => {
        if (roleVal === UserRole.REGOLARE) return 'Pioniere Regolare';
        if (roleVal === UserRole.AUSILIARIO_30) return 'Pioniere Ausiliario 30h';
        if (roleVal === UserRole.AUSILIARIO_15) return 'Pioniere Ausiliario 15h';
        return 'Proclamatore';
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}min`;
    };

    const reportData = useMemo(() => {
        if (!dateRange[0] || !dateRange[1]) return null;
        
        const start = dayjs(dateRange[0]).startOf('day');
        const end = dayjs(dateRange[1]).endOf('day');
        
        // 1. Filter entries
        const filteredEntries = entries.filter(e => {
            const d = dayjs(e.date);
            return (d.isAfter(start) || d.isSame(start, 'day')) && (d.isBefore(end) || d.isSame(end, 'day'));
        });

        // Sort chronologically (oldest first)
        filteredEntries.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.toMillis() - b.startTime.toMillis();
        });

        const totalEntriesCount = filteredEntries.length;

        // 2. Tally hours
        const totalSeconds = filteredEntries.reduce((acc, e) => acc + e.duration, 0);

        // 3. Gather Roles during this period
        let currentMonthIter = start.startOf('month');
        const coveredMonths: string[] = [];
        while (currentMonthIter.isBefore(end) || currentMonthIter.isSame(end, 'month')) {
            coveredMonths.push(currentMonthIter.format('YYYY-MM'));
            currentMonthIter = currentMonthIter.add(1, 'month');
        }
        
        const rolesInPeriod = coveredMonths.map(m => rolesMap[m] || UserRole.PROCLAMATORE);
        const uniqueRoles = Array.from(new Set(rolesInPeriod));
        const rolesString = uniqueRoles.map(formatRoleName).join(', ');

        // 4. Build detail rows for the table
        const detailRows = filteredEntries.map(entry => {
            const dateFormatted = dayjs(entry.date).format('dddd D MMMM');
            const startTimeFormatted = dayjs(entry.startTime.toDate()).format('HH:mm');
            const endTimeFormatted = dayjs(entry.endTime.toDate()).format('HH:mm');
            const timeRange = `${startTimeFormatted} - ${endTimeFormatted}`;
            const durationFormatted = formatDuration(entry.duration);
            
            // Gather all publications (generic + from contacts)
            const allPubs: string[] = [];
            if (entry.deliveredPublications) {
                allPubs.push(...entry.deliveredPublications);
            }
            if (entry.contacts) {
                entry.contacts.forEach(c => {
                    if (c.deliveredPublications) {
                        allPubs.push(...c.deliveredPublications);
                    }
                });
            }
            const pubsString = allPubs.length > 0 ? allPubs.join(', ') : '-';

            return {
                dateFormatted,
                timeRange,
                durationFormatted,
                pubsString,
                duration: entry.duration
            };
        });
            
        return {
            start, 
            end,
            totalSeconds,
            rolesString,
            totalEntriesCount,
            detailRows
        };
    }, [dateRange, entries, rolesMap]);

    const handleGeneratePDF = () => {
        if (!user || !reportData) return;
        
        const { start, end, totalSeconds, rolesString, detailRows } = reportData;

        // Start PDF
        const doc = new jsPDF();
        
        // Graphic Header
        doc.setFillColor(51, 154, 240);
        doc.rect(0, 0, 210, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("Report Servizio di Campo", 14, 17);
        
        doc.setFontSize(10);
        doc.text(`Generato: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 155, 17);
        
        // 1st Table: User Info
        autoTable(doc, {
            startY: 40,
            head: [['Riepilogo', '']],
            body: [
                ['Nome', user.displayName || 'Utente'],
                ['Periodo', `dal ${start.format('DD/MM/YYYY')} al ${end.format('DD/MM/YYYY')}`],
                ['Ruolo/i', rolesString],
            ],
            theme: 'grid',
            headStyles: { fillColor: [73, 80, 87], halign: 'center' },
            columnStyles: { 
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 130 }
            },
            styles: { fontSize: 12 }
        });

        let currentY = (doc as any).lastAutoTable.finalY + 10;

        // 2nd Table: Detailed service entries
        const tableRows = detailRows.map(row => [
            row.dateFormatted,
            row.timeRange,
            row.durationFormatted,
            row.pubsString,
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Data', 'Orario', 'Tempo', 'Pubblicazioni']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [51, 154, 240] },
            columnStyles: {
                0: { cellWidth: 55 },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 'auto' }
            },
            styles: { fontSize: 10 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Total at the bottom
        autoTable(doc, {
            startY: currentY,
            body: [
                ['TEMPO TOTALE', formatTimeHours(totalSeconds)],
            ],
            theme: 'plain',
            columnStyles: {
                0: { fontStyle: 'bold', fontSize: 14, cellWidth: 130 },
                1: { fontStyle: 'bold', fontSize: 14, halign: 'right', textColor: [51, 154, 240] }
            },
            styles: { fontSize: 14 }
        });

        doc.save(`Report_${start.format('DD-MM-YYYY')}_${end.format('DD-MM-YYYY')}.pdf`);
    };

    return (
        <Stack gap="md" h="100%">
            {/* Control Panel */}
            <Paper p="md" radius="md" withBorder>
                <Stack gap="sm">
                    <Group align="center" gap="xs">
                        <IconFileDescription size={24} color="var(--mantine-color-blue-6)" />
                        <Title order={4}>Genera Report PDF</Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Seleziona un periodo di date per filtrare le attività, calcolare i totali ed esportare un PDF riassuntivo stampabile.
                    </Text>

                    <DatePickerInput
                        type="range"
                        label="Periodo (Dal - Al)"
                        placeholder="Seleziona date"
                        value={dateRange}
                        onChange={(val) => setDateRange(val as [Date | null, Date | null])}
                        locale="it"
                        clearable
                        style={{ maxWidth: 300 }}
                    />

                    <Button 
                        mt="md"
                        leftSection={<IconDownload size={18} />} 
                        onClick={handleGeneratePDF}
                        disabled={!dateRange[0] || !dateRange[1]}
                        color="blue"
                        style={{ alignSelf: 'flex-start' }}
                    >
                        Scarica PDF
                    </Button>
                </Stack>
            </Paper>

            {/* Live Preview Panel */}
            {reportData && (
                <Paper p="md" radius="md" withBorder>
                     <Title order={5} mb="sm">Anteprima Dati Filtrati</Title>
                     
                     <Grid mb="xl" mt="md">
                         <Grid.Col span={{ base: 6, sm: 4 }}>
                             <Text size="sm" c="dimmed">Periodo</Text>
                             <Text fw={500}>{reportData.start.format('DD/MM')} - {reportData.end.format('DD/MM/YYYY')}</Text>
                         </Grid.Col>
                         <Grid.Col span={{ base: 6, sm: 4 }}>
                             <Text size="sm" c="dimmed">Uscite Registrate</Text>
                             <Text fw={500}>{reportData.totalEntriesCount}</Text>
                         </Grid.Col>
                         <Grid.Col span={{ base: 6, sm: 4 }}>
                             <Text size="sm" c="dimmed">Ore Totali</Text>
                             <Text fw={700} c="blue" size="lg">{formatTimeHours(reportData.totalSeconds)}</Text>
                         </Grid.Col>
                     </Grid>
                     
                     <Title order={6} mb="xs">Dettaglio Uscite</Title>
                     {reportData.detailRows.length > 0 ? (
                         <Table striped highlightOnHover withTableBorder>
                             <Table.Thead>
                                 <Table.Tr>
                                     <Table.Th>Data</Table.Th>
                                     <Table.Th>Orario</Table.Th>
                                     <Table.Th>Tempo</Table.Th>
                                     <Table.Th>Pubblicazioni</Table.Th>
                                 </Table.Tr>
                             </Table.Thead>
                             <Table.Tbody>
                                 {reportData.detailRows.map((row, idx) => (
                                     <Table.Tr key={idx}>
                                         <Table.Td tt="capitalize">{row.dateFormatted}</Table.Td>
                                         <Table.Td>{row.timeRange}</Table.Td>
                                         <Table.Td>{row.durationFormatted}</Table.Td>
                                         <Table.Td>{row.pubsString}</Table.Td>
                                     </Table.Tr>
                                 ))}
                             </Table.Tbody>
                         </Table>
                     ) : (
                         <Text size="sm" c="dimmed" fs="italic">Nessuna uscita trovata nel periodo selezionato.</Text>
                     )}
                </Paper>
            )}
        </Stack>
    );
}
