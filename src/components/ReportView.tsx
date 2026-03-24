import { Stack, Paper, Title, Group, Button, Text, Grid, Table } from '@mantine/core';
import { DatePickerInput, Calendar } from '@mantine/dates';
import { IconFileDescription, IconDownload } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
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

    const entriesByDate = useMemo(() => {
        return entries.reduce((acc, entry) => {
            if (!acc[entry.date]) acc[entry.date] = [];
            acc[entry.date].push(entry);
            return acc;
        }, {} as Record<string, ServiceEntry[]>);
    }, [entries]);

    const renderDay = (date: Date) => {
        const d = dayjs(date);
        const dateStr = d.format('YYYY-MM-DD');
        const dayEntries = entriesByDate[dateStr] || [];
        const hasService = dayEntries.length > 0;
        const hasContacts = dayEntries.some(e => e.contacts && e.contacts.length > 0);
        const isToday = d.isSame(dayjs(), 'day');
        
        return (
            <div 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    position: 'relative',
                    backgroundColor: isToday ? 'var(--mantine-color-teal-0)' : undefined,
                    borderRadius: 8
                }}
            >
                <span style={{ 
                    fontWeight: isToday ? 700 : undefined, 
                    color: isToday ? 'var(--mantine-color-teal-7)' : undefined 
                }}>
                    {d.date()}
                </span>
                
                {/* Indicators Container */}
                <div style={{ 
                    position: 'absolute', 
                    bottom: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2, 
                    width: '100%', 
                    alignItems: 'center' 
                }}>
                    {hasService && (
                        <div style={{ width: '60%', height: 3, backgroundColor: 'var(--mantine-color-teal-5)', borderRadius: 2 }} />
                    )}
                    {hasContacts && (
                        <div style={{ width: '60%', height: 3, backgroundColor: 'var(--mantine-color-red-5)', borderRadius: 2 }} />
                    )}
                </div>
            </div>
        );
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
        const coveredMonthDates: Date[] = [];
        const coveredMonths: string[] = [];
        while (currentMonthIter.isBefore(end) || currentMonthIter.isSame(end, 'month')) {
            coveredMonths.push(currentMonthIter.format('YYYY-MM'));
            coveredMonthDates.push(currentMonthIter.toDate());
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
            if (entry.deliveredPublications) {
                entry.deliveredPublications.forEach(pub => {
                    if (pubsCount[pub] !== undefined) {
                        pubsCount[pub]++;
                    } else {
                        pubsCount[pub] = (pubsCount[pub] || 0) + 1;
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
            totalEntriesCount,
            coveredMonthDates
        };
    }, [dateRange, entries, rolesMap, catalog]);

    const handleGeneratePDF = async () => {
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
        
        // Capture calendar
        const calendarContainer = document.getElementById('hidden-calendars');
        if (calendarContainer) {
            try {
                const canvas = await html2canvas(calendarContainer, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                
                const pdfWidth = doc.internal.pageSize.getWidth() - 28; // 14 padding on each side
                const imgProps = doc.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                const spaceLeft = doc.internal.pageSize.getHeight() - finalY;
                
                if (imgHeight > spaceLeft - 10 && finalY > 60) {
                     doc.addPage();
                     doc.addImage(imgData, 'PNG', 14, 20, pdfWidth, imgHeight);
                } else {
                     doc.addImage(imgData, 'PNG', 14, finalY + 15, pdfWidth, imgHeight);
                }
            } catch (e) {
                console.error("Failed to capture calendar for PDF", e);
            }
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

            {/* Hidden Calendars for PDF generation */}
            {reportData && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
                    <div id="hidden-calendars" style={{ display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: 'white', width: '800px' }}>
                        <Title order={4} mb="lg" style={{ textAlign: 'center' }}>
                            Dettaglio Giornaliero
                        </Title>
                        <Group justify="center" align="flex-start" gap="xl" wrap="wrap">
                            {reportData.coveredMonthDates.map((monthDate, idx) => (
                                <Stack key={idx} align="center" gap="xs">
                                    <Text fw={700} tt="capitalize" size="lg">{dayjs(monthDate).format('MMMM YYYY')}</Text>
                                    <Paper withBorder p="md" radius="md" shadow="sm">
                                        <Calendar 
                                            static
                                            date={monthDate}
                                            renderDay={(date) => renderDay(date as any)}
                                            locale="it"
                                            size="xl"
                                            styles={{
                                                day: { borderRadius: 8 },
                                                calendarHeader: { display: 'none' } // hide internal header
                                            }}
                                        />
                                    </Paper>
                                </Stack>
                            ))}
                        </Group>
                    </div>
                </div>
            )}

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
