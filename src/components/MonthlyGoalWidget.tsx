import { Paper, Text, Group, Stack, RingProgress, ThemeIcon, Center, Grid } from '@mantine/core';
import { IconTargetArrow, IconCalendarTime, IconClockCheck, IconHourglassHigh, IconTrophy } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { subscribeToUserSettings } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import type { ServiceEntry } from '../types';
import { UserRole, ROLE_GOALS } from '../types';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { formatTimeHours } from '../utils/formatUtils';

dayjs.locale('it');

interface MonthlyGoalWidgetProps {
    entries: ServiceEntry[];
}

export default function MonthlyGoalWidget({ entries }: MonthlyGoalWidgetProps) {
    const { user } = useAuth();
    const [goalHours, setGoalHours] = useState<number>(0);
    const [selectedRole, setSelectedRole] = useState<string>(UserRole.PROCLAMATORE);
    const [yearlyArrears, setYearlyArrears] = useState<number>(0);
    
    const now = dayjs();
    const currentMonthKey = now.format('YYYY-MM');
    const currentYearKey = now.format('YYYY');
    const daysInMonth = now.daysInMonth();
    const daysRemaining = daysInMonth - now.date();

    // Fetch Goal
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToUserSettings(user.uid, (settings) => {
             const roles = settings.monthlyRoles || {};
             const role = roles[currentMonthKey] || UserRole.PROCLAMATORE;
             setSelectedRole(role);
             
             const preset = ROLE_GOALS[role];
             if (preset === null) {
                 const goals = settings.monthlyGoals || {};
                 setGoalHours(Number(goals[currentMonthKey] || 0));
             } else {
                 setGoalHours(preset);
             }
             
             const arrears = settings.yearlyArrears || {};
             setYearlyArrears(Number(arrears[currentYearKey] || 0));
        });
        return () => unsubscribe();
    }, [user, currentMonthKey, currentYearKey]);

    // Calculate Realized Time for current month
    const totalSecondsMonth = entries
        .filter(e => dayjs(e.date).format('YYYY-MM') === currentMonthKey)
        .reduce((acc, curr) => acc + curr.duration, 0);
    
    // Calculate Yearly Data
    const totalSecondsYear = entries
        .filter(e => dayjs(e.date).format('YYYY') === currentYearKey)
        .reduce((acc, curr) => acc + curr.duration, 0);
        
    const totalRealizedSecondsYearlyWithArrears = totalSecondsYear + (yearlyArrears * 3600);
    const totalYearlyHoursWithArrears = totalRealizedSecondsYearlyWithArrears / 3600;
    
    const yearlyPercentage = Math.min((totalYearlyHoursWithArrears / 600) * 100, 100);
    const safeYearlyPercentage = isNaN(yearlyPercentage) ? 0 : yearlyPercentage;
    const remainingYearlySeconds = Math.max((600 * 3600) - totalRealizedSecondsYearlyWithArrears, 0);
    
    const realizedHoursMonth = totalSecondsMonth / 3600;
    const percentage = goalHours > 0 ? Math.min((realizedHoursMonth / goalHours) * 100, 100) : 0;
    const safePercentage = isNaN(percentage) ? 0 : percentage;
    const remainingSecondsMonth = Math.max((goalHours * 3600) - totalSecondsMonth, 0);

    const renderEmpty = () => (
         <Paper shadow="sm" radius="md" p="md" withBorder>
            <Group>
                <ThemeIcon variant="light" color="gray" size="lg" radius="md">
                    <IconTargetArrow size={20} />
                </ThemeIcon>
                <Stack gap={0}>
                     <Text size="sm" fw={500}>Nessun obiettivo fissato</Text>
                     <Text size="xs" c="dimmed">Vai in Impostazioni per scegliere un ruolo o impostare un obiettivo per {now.format('MMMM')}.</Text>
                </Stack>
            </Group>
         </Paper>
    );

    return (
        <Stack gap="md">
            {goalHours === 0 ? renderEmpty() : (
                <Paper shadow="sm" radius="md" p="md" withBorder>
                     <Group justify="space-between" align="flex-start" mb="md">
                         <Group gap="sm">
                            <ThemeIcon variant="light" color="indigo" size="lg" radius="md">
                                <IconTargetArrow size={20} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase">Obiettivo {now.format('MMMM YYYY')}</Text>
                                <Text size="lg" fw={700}>{goalHours} Ore</Text>
                            </Stack>
                         </Group>
                         <BadgeDaysLeft days={daysRemaining} />
                     </Group>

                     <Grid align="center" gutter="md">
                         <Grid.Col span={{ base: 12, xs: 5 }}>
                            <Center>
                                 <RingProgress 
                                    size={140}
                                    thickness={12}
                                    roundCaps
                                    sections={[{ value: safePercentage, color: 'indigo' }]}
                                    label={
                                        <Center>
                                            <Stack gap={0} align="center">
                                                <Text fw={700} size="xl">{safePercentage.toFixed(0)}%</Text>
                                            </Stack>
                                        </Center>
                                    }
                                 />
                            </Center>
                         </Grid.Col>
                         
                         <Grid.Col span={{ base: 12, xs: 7 }}>
                             <Stack gap="md">
                                 <StatRow 
                                    icon={<IconClockCheck size={16} />} 
                                    label="Fatto" 
                                    value={formatTimeHours(totalSecondsMonth)} 
                                    color="teal"
                                 />
                                 <StatRow 
                                    icon={<IconHourglassHigh size={16} />} 
                                    label="Rimanente" 
                                    value={formatTimeHours(remainingSecondsMonth)} 
                                    color="orange"
                                 />
                             </Stack>
                         </Grid.Col>
                     </Grid>
                </Paper>
            )}

            {selectedRole === UserRole.REGOLARE && (
                <Paper shadow="sm" radius="md" p="md" withBorder>
                     <Group justify="space-between" align="flex-start" mb="md">
                         <Group gap="sm">
                            <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                                <IconTrophy size={20} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Text size="xs" fw={700} c="dimmed" tt="uppercase">Obiettivo Annuale ({currentYearKey})</Text>
                                <Text size="lg" fw={700}>600 Ore</Text>
                            </Stack>
                         </Group>
                     </Group>

                     <Grid align="center" gutter="md">
                         <Grid.Col span={{ base: 12, xs: 5 }}>
                            <Center>
                                 <RingProgress 
                                    size={140}
                                    thickness={12}
                                    roundCaps
                                    sections={[{ value: safeYearlyPercentage, color: 'yellow.6' }]}
                                    label={
                                        <Center>
                                            <Stack gap={0} align="center">
                                                <Text fw={700} size="xl">{safeYearlyPercentage.toFixed(0)}%</Text>
                                            </Stack>
                                        </Center>
                                    }
                                 />
                            </Center>
                         </Grid.Col>
                         
                         <Grid.Col span={{ base: 12, xs: 7 }}>
                             <Stack gap="md">
                                 <StatRow 
                                    icon={<IconClockCheck size={16} />} 
                                    label={yearlyArrears > 0 ? "Fatto (con arretrati)" : "Fatto"} 
                                    value={formatTimeHours(totalRealizedSecondsYearlyWithArrears)} 
                                    color="teal"
                                 />
                                 <StatRow 
                                    icon={<IconHourglassHigh size={16} />} 
                                    label="Rimanente" 
                                    value={formatTimeHours(remainingYearlySeconds)} 
                                    color="orange"
                                 />
                             </Stack>
                         </Grid.Col>
                     </Grid>
                </Paper>
            )}
        </Stack>
    );
}

function StatRow({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
    return (
        <Group justify="space-between">
            <Group gap="xs">
                 <Text c={color} size="sm" style={{ display: 'flex' }}>{icon}</Text>
                 <Text size="sm" c="dimmed">{label}</Text>
            </Group>
            <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</Text>
        </Group>
    )
}

function BadgeDaysLeft({ days }: { days: number }) {
    return (
        <Paper withBorder px="xs" py={4} radius="sm" bg="var(--mantine-color-gray-0)">
            <Group gap={6}>
                <IconCalendarTime size={14} color="gray" />
                <Text size="xs" fw={600} c="dimmed">{days} gg rim.</Text>
            </Group>
        </Paper>
    )
}
