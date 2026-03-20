import { Stack, Paper, Title, Group, Button, Text, Grid, Table } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFileDescription, IconDownload } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserSettings } from '../services/firestore';
import type { ServiceEntry } from '../types';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserRole } from '../types';
import { formatTimeHours } from '../utils/formatUtils';

interface ReportViewProps {
    entries: ServiceEntry[];
}

export default function ReportView({ entries }: ReportViewProps) {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([dayjs().startOf('month').toDate(), dayjs().endOf('month').toDate()]);
    const [catalog, setCatalog] = useState<string[]>([]);
    const [rolesMap, setRolesMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToUserSettings(user.uid, (settings) => {
            setCatalog(settings.publicationCatalog || []);
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

    const reportData = useMemo(() => {
        if (!dateRange[0] || !dateRange[1]) return null;
        
        const start = dayjs(dateRange[0]).startOf('day');
        const end = dayjs(dateRange[1]).endOf('day');
        
        // 1. Filter entries
        const filteredEntries = entries.filter(e => {
            const d = dayjs(e.date);
            return (d.isAfter(start) || d.isSame(start, 'day')) && (d.isBefore(end) || d.isSame(end, 'day'));
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

        // 4. Gather Publications
        const pubsCount: Record<string, number> = {};
        
        // Ensure catalog entries exist initialized to 0
        catalog.forEach(cat => pubsCount[cat] = 0);
        
        filteredEntries.forEach(entry => {
            if (entry.contacts) {
                entry.contacts.forEach(contact => {
                    if (contact.deliveredPublications) {
                        contact.deliveredPublications.forEach(pub => {
                            if (pubsCount[pub] !== undefined) {
                                pubsCount[pub]++;
                            } else {
                                pubsCount[pub] = (pubsCount[pub] || 0) + 1;
                            }
                        });
                    }
                });
            }
        });

        const tableBody = Object.entries(pubsCount)
            .filter(([_, count]) => count > 0)
            .map(([title, count]) => [title, count.toString()]);
            
        return {
            start, 
            end,
            totalSeconds,
            rolesString,
            tableBody,
            totalEntriesCount
        };
    }, [dateRange, entries, rolesMap, catalog]);

    const handleGeneratePDF = () => {
        if (!user || !reportData) return;
        
        const { start, end, totalSeconds, rolesString, tableBody } = reportData;

        // Start PDF
        const doc = new jsPDF();
        
        // Graphic Header
        doc.setFillColor(51, 154, 240); // Base Blue color
        doc.rect(0, 0, 210, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("Report Servizio di Campo", 14, 17);
        
        doc.setFontSize(10);
        doc.text(`Generato: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 155, 17);
        
        // Summary Table
        autoTable(doc, {
            startY: 40,
            head: [['Riepilogo Dati', '']],
            body: [
                ['Nome', user.displayName || 'Utente'],
                ['Periodo', `dal ${start.format('DD/MM/YYYY')} al ${end.format('DD/MM/YYYY')}`],
                ['Ruolo/i', rolesString],
                ['Ore Totali', formatTimeHours(totalSeconds)],
            ],
            theme: 'grid',
            headStyles: { fillColor: [73, 80, 87], halign: 'center' }, // Dark gray
            columnStyles: { 
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 130 }
            },
            styles: { fontSize: 12 }
        });

        // Current Y position after table
        const finalY = (doc as any).lastAutoTable.finalY + 15;

        // Publications Table
        if (tableBody.length > 0) {
            autoTable(doc, {
                startY: finalY,
                head: [['Pubblicazioni Consegnate', 'Quantità']],
                body: tableBody,
                theme: 'striped',
                headStyles: { fillColor: [51, 154, 240] },
                columnStyles: {
                    1: { halign: 'center', cellWidth: 40 }
                },
                styles: { fontSize: 11 }
            });
        } else {
            doc.setTextColor(100);
            doc.setFontSize(12);
            doc.text("Nessuna pubblicazione registrata in questo periodo.", 14, finalY);
        }

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
                         <Grid.Col span={{ base: 6, sm: 3 }}>
                             <Text size="sm" c="dimmed">Periodo</Text>
                             <Text fw={500}>{reportData.start.format('DD/MM')} - {reportData.end.format('DD/MM/YYYY')}</Text>
                         </Grid.Col>
                         <Grid.Col span={{ base: 6, sm: 3 }}>
                             <Text size="sm" c="dimmed">Ruolo/i</Text>
                             <Text fw={500} lineClamp={1} title={reportData.rolesString}>{reportData.rolesString}</Text>
                         </Grid.Col>
                         <Grid.Col span={{ base: 6, sm: 3 }}>
                             <Text size="sm" c="dimmed">Uscite Registrate</Text>
                             <Text fw={500}>{reportData.totalEntriesCount}</Text>
                         </Grid.Col>
                         <Grid.Col span={{ base: 6, sm: 3 }}>
                             <Text size="sm" c="dimmed">Ore Totali</Text>
                             <Text fw={700} c="blue" size="lg">{formatTimeHours(reportData.totalSeconds)}</Text>
                         </Grid.Col>
                     </Grid>
                     
                     <Title order={6} mb="xs">Pubblicazioni Consegnate in Questo Periodo</Title>
                     {reportData.tableBody.length > 0 ? (
                         <Table striped highlightOnHover withTableBorder>
                             <Table.Thead>
                                 <Table.Tr>
                                     <Table.Th>Titolo</Table.Th>
                                     <Table.Th w={100} style={{ textAlign: 'right' }}>Quantità</Table.Th>
                                 </Table.Tr>
                             </Table.Thead>
                             <Table.Tbody>
                                 {reportData.tableBody.map((row, idx) => (
                                     <Table.Tr key={idx}>
                                         <Table.Td>{row[0]}</Table.Td>
                                         <Table.Td style={{ textAlign: 'right' }} fw={500}>{row[1]}</Table.Td>
                                     </Table.Tr>
                                 ))}
                             </Table.Tbody>
                         </Table>
                     ) : (
                         <Text size="sm" c="dimmed" fs="italic">Nessuna pubblicazione consegnata.</Text>
                     )}
                </Paper>
            )}
        </Stack>
    );
}
