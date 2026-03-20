import { Stack, Paper, Text, Group, TextInput, ActionIcon, Title, ScrollArea, NumberInput, Button, Select, Divider } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { IconPlus, IconTrash, IconBook, IconTargetArrow, IconHistory } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { updatePublicationCatalog, subscribeToUserSettings, updateMonthlyRoleAndGoal, updateYearlyArrears } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import { UserRole, ROLE_GOALS } from '../types';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

dayjs.locale('it');

export default function SettingsView() {
    const { user } = useAuth();
    const [catalog, setCatalog] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    
    // Monthly Goals & Roles State
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
    const [goalHours, setGoalHours] = useState<number | ''>('');
    const [selectedRole, setSelectedRole] = useState<string>(UserRole.PROCLAMATORE);
    const [goalsMap, setGoalsMap] = useState<Record<string, number>>({});
    const [rolesMap, setRolesMap] = useState<Record<string, string>>({});
    
    // Arrears
    const [arrearsToAdd, setArrearsToAdd] = useState<number | ''>('');
    const [currentArrears, setCurrentArrears] = useState<number>(0);
    const [arrearsMap, setArrearsMap] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToUserSettings(user.uid, (settings) => {
            setCatalog(settings.publicationCatalog);
            setGoalsMap(settings.monthlyGoals);
            setRolesMap(settings.monthlyRoles);
            setArrearsMap(settings.yearlyArrears);
        });
        return () => unsubscribe();
    }, [user]);

    // Update input when month selection changes
    useEffect(() => {
        if (selectedMonth) {
            const key = dayjs(selectedMonth).format('YYYY-MM');
            const role = rolesMap[key] || UserRole.PROCLAMATORE;
            setSelectedRole(role);
            
            const preset = ROLE_GOALS[role];
            if (preset === null) {
                setGoalHours(goalsMap[key] || '');
            } else {
                setGoalHours(preset);
            }
            
            const yearKey = dayjs(selectedMonth).format('YYYY');
            setCurrentArrears(arrearsMap[yearKey] || 0);
        }
    }, [selectedMonth, goalsMap, rolesMap, arrearsMap]);

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
        if (!user || !selectedMonth) return;
        const key = dayjs(selectedMonth).format('YYYY-MM');
        
        let hoursToSave: number | undefined = undefined;
        const preset = ROLE_GOALS[selectedRole];
        if (preset === null) {
            if (goalHours !== '') hoursToSave = Number(goalHours);
        } else {
            hoursToSave = preset;
        }
        
        await updateMonthlyRoleAndGoal(user.uid, key, selectedRole, hoursToSave);
    };

    const handleSaveArrears = async () => {
        if (!user || !selectedMonth || arrearsToAdd === '' || arrearsToAdd === 0) return;
        const year = dayjs(selectedMonth).format('YYYY');
        const newTotal = currentArrears + Number(arrearsToAdd);
        await updateYearlyArrears(user.uid, year, newTotal);
        setArrearsToAdd('');
    };

    const formatSavedRole = (roleVal: string) => {
        if (roleVal === UserRole.REGOLARE) return 'Regolare';
        if (roleVal === UserRole.AUSILIARIO_30) return 'Ausiliario 30h';
        if (roleVal === UserRole.AUSILIARIO_15) return 'Ausiliario 15h';
        return 'Proclamatore';
    };

    return (
        <Stack gap="md" h="100%">
            
            {/* Monthly Goals Section */}
            <Paper p="md" radius="md" withBorder>
                <Stack gap="sm">
                    <Group align="center" gap="xs">
                        <IconTargetArrow size={24} color="var(--mantine-color-teal-6)" />
                        <Title order={4}>Obiettivo Mensile e Ruolo</Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Imposta il tuo ruolo per un determinato mese per calcolare correttamente gli obiettivi mensili o annuali.
                    </Text>

                    <Group align="end">
                         <MonthPickerInput
                            label="Mese"
                            placeholder="Seleziona mese"
                            value={selectedMonth}
                            onChange={(date) => setSelectedMonth(date as Date | null)}
                            style={{ flex: 1, minWidth: 150 }}
                            locale="it"
                         />
                         <Select
                            label="Ruolo"
                            value={selectedRole}
                            onChange={(val) => {
                                if (val) {
                                    setSelectedRole(val);
                                    const preset = ROLE_GOALS[val];
                                    setGoalHours(preset === null ? '' : preset);
                                }
                            }}
                            data={[
                                { value: UserRole.PROCLAMATORE, label: 'Proclamatore' },
                                { value: UserRole.AUSILIARIO_15, label: 'Pioniere Ausiliario (15h)' },
                                { value: UserRole.AUSILIARIO_30, label: 'Pioniere Ausiliario (30h)' },
                                { value: UserRole.REGOLARE, label: 'Pioniere Regolare 600h annuali (50h media mensile)' },
                            ]}
                            style={{ flex: 1, minWidth: 200 }}
                         />
                         
                         {selectedRole === UserRole.PROCLAMATORE && (
                             <NumberInput
                                label="Ore Obiettivo"
                                placeholder="..."
                                min={0}
                                value={goalHours}
                                onChange={(val) => setGoalHours(val === '' ? '' : Number(val))}
                                style={{ width: 100 }}
                             />
                         )}
                         <Button onClick={handleSaveGoal} disabled={!selectedMonth || (selectedRole === UserRole.PROCLAMATORE && goalHours === '')} color="teal">
                            Salva
                         </Button>
                    </Group>
                    
                    {selectedMonth && (
                       <Text size="xs" c="dimmed" mt={4}>
                           Salvato per {dayjs(selectedMonth).format('MMMM YYYY')}: Ruolo <b>{formatSavedRole(rolesMap[dayjs(selectedMonth).format('YYYY-MM')])}</b> ({goalsMap[dayjs(selectedMonth).format('YYYY-MM')] || '-'} ore)
                       </Text>
                    )}

                    {selectedRole === UserRole.REGOLARE && (
                        <>
                            <Divider my="sm" />
                            
                            <Group align="center" gap="xs">
                                <IconHistory size={24} color="var(--mantine-color-orange-6)" />
                                <Title order={4}>Monte Ore Arretrato ({selectedMonth ? dayjs(selectedMonth).format('YYYY') : ''})</Title>
                            </Group>
                            <Text size="sm" c="dimmed">
                                Se hai iniziato a usare l'app da poco, puoi inserire qui le ore dei mesi passati per allineare l'obiettivo annuale (600h). Puoi usare numeri negativi per sottrarre.
                            </Text>
                            <Group align="end">
                                 <NumberInput
                                    label="Aggiungi ore arretrate"
                                    placeholder="Es. 15"
                                    value={arrearsToAdd}
                                    onChange={(val) => setArrearsToAdd(val === '' ? '' : Number(val))}
                                    style={{ flex: 1, maxWidth: 200 }}
                                 />
                                 <Button onClick={handleSaveArrears} disabled={!selectedMonth || arrearsToAdd === '' || arrearsToAdd === 0} color="orange">
                                    Aggiungi
                                 </Button>
                            </Group>
                            <Text size="xs" fw={500} mt="xs">
                                Totale arretrati salvati per il {selectedMonth ? dayjs(selectedMonth).format('YYYY') : ''}: <Text span c="orange" fw={700}>{currentArrears} ore</Text>
                            </Text>
                        </>
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
