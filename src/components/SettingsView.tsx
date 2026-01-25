import { Stack, Paper, Text, Group, TextInput, ActionIcon, Title, ScrollArea, NumberInput, Button } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { IconPlus, IconTrash, IconBook, IconTargetArrow } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { updatePublicationCatalog, subscribeToUserSettings, updateMonthlyGoal } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

dayjs.locale('it');

export default function SettingsView() {
    const { user } = useAuth();
    const [catalog, setCatalog] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    
    // Monthly Goals State
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
    const [goalHours, setGoalHours] = useState<number | ''>('');
    const [goalsMap, setGoalsMap] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToUserSettings(user.uid, (settings) => {
            setCatalog(settings.publicationCatalog);
            setGoalsMap(settings.monthlyGoals);
        });
        return () => unsubscribe();
    }, [user]);

    // Update input when month selection changes or goalsMap loads
    useEffect(() => {
        if (selectedMonth) {
            const key = dayjs(selectedMonth).format('YYYY-MM');
            setGoalHours(goalsMap[key] || '');
        }
    }, [selectedMonth, goalsMap]);

    const handleAdd = async () => {
        if (!newItem.trim() || !user) return;
        const updated = [...catalog, newItem.trim()];
        await updatePublicationCatalog(user.uid, updated);
        setNewItem('');
    };

    const handleDelete = async (index: number) => {
        if (!user) return;
        const updated = catalog.filter((_, i) => i !== index);
        await updatePublicationCatalog(user.uid, updated);
    };

    const handleSaveGoal = async () => {
        if (!user || !selectedMonth || goalHours === '') return;
        const key = dayjs(selectedMonth).format('YYYY-MM');
        await updateMonthlyGoal(user.uid, key, Number(goalHours));
        // Optional: show notification?
    };

    return (
        <Stack gap="md" h="100%">
            
            {/* Monthly Goals Section */}
            <Paper p="md" radius="md" withBorder>
                <Stack gap="sm">
                    <Group align="center" gap="xs">
                        <IconTargetArrow size={24} color="var(--mantine-color-teal-6)" />
                        <Title order={4}>Obiettivo Mensile</Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Imposta le ore di servizio che vuoi raggiungere per un determinato mese.
                    </Text>

                    <Group align="end">
                         <MonthPickerInput
                            label="Mese"
                            placeholder="Seleziona mese"
                            value={selectedMonth}
                            onChange={(date) => setSelectedMonth(date as Date | null)}
                            style={{ flex: 1 }}
                            locale="it"
                         />
                         <NumberInput
                            label="Ore Obiettivo"
                            placeholder="50"
                            min={0}
                            value={goalHours}
                            onChange={(val) => setGoalHours(val === '' ? '' : Number(val))}
                            style={{ width: 100 }}
                         />
                         <Button onClick={handleSaveGoal} disabled={!selectedMonth || goalHours === ''} color="teal">
                            Salva
                         </Button>
                    </Group>
                    
                    {selectedMonth && (
                       <Text size="xs" c="dimmed" mt={4}>
                           Attuale per {dayjs(selectedMonth).format('MMMM YYYY')}: <b>{goalsMap[dayjs(selectedMonth).format('YYYY-MM')] || '-'}</b> ore
                       </Text>
                    )}
                </Stack>
            </Paper>

            {/* Catalog Section */}
            <Paper p="md" radius="md" withBorder>
                <Stack gap="sm">
                    <Group align="center" gap="xs">
                        <IconBook size={24} color="var(--mantine-color-blue-6)" />
                        <Title order={4}>Catalogo Pubblicazioni</Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Aggiungi qui le pubblicazioni che usi di solito. Le ritroverai nel menu a tendina quando salvi un contatto.
                    </Text>
                    
                    <Group mt="xs">
                        <TextInput 
                            placeholder="Es. Torre di Guardia 1/24" 
                            style={{ flex: 1 }}
                            value={newItem}
                            onChange={(e) => setNewItem(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAdd();
                            }}
                        />
                        <ActionIcon variant="filled" color="blue" size="lg" onClick={handleAdd} disabled={!newItem.trim()}>
                            <IconPlus size={20} />
                        </ActionIcon>
                    </Group>
                </Stack>
            </Paper>

            <Text fw={700} size="sm" mt="sm">Elenco Attuale ({catalog.length})</Text>
            
            <ScrollArea h="calc(100vh - 450px)" type="auto" offsetScrollbars>
                <Stack gap="xs">
                    {catalog.length === 0 ? (
                        <Text fs="italic" c="dimmed" size="sm">Nessuna pubblicazione salvata.</Text>
                    ) : (
                        catalog.map((item, index) => (
                            <Paper key={index} p="sm" radius="md" withBorder>
                                <Group justify="space-between">
                                    <Text size="sm" fw={500}>{item}</Text>
                                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(index)}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            </Paper>
                        ))
                    )}
                </Stack>
            </ScrollArea>
        </Stack>
    );
}
