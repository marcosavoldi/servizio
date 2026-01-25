import { Paper, Text, Group, Stack, RingProgress, ThemeIcon, Center, Grid } from '@mantine/core';
import { IconTargetArrow, IconCalendarTime, IconClockCheck, IconHourglassHigh } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { subscribeToUserSettings } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import type { ServiceEntry } from '../types';
import dayjs from 'dayjs';
import { formatTimeHours } from '../utils/formatUtils';

interface MonthlyGoalWidgetProps {
    entries: ServiceEntry[];
}

export default function MonthlyGoalWidget({ entries }: MonthlyGoalWidgetProps) {
    const { user } = useAuth();
    const [goalHours, setGoalHours] = useState<number>(0);
    
    const now = dayjs();
    const currentMonthKey = now.format('YYYY-MM');
    const daysInMonth = now.daysInMonth();
    const daysRemaining = daysInMonth - now.date();

    // Fetch Goal
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToUserSettings(user.uid, (settings) => {
             const goals = settings.monthlyGoals || {};
             setGoalHours(goals[currentMonthKey] || 0);
        });
        return () => unsubscribe();
    }, [user, currentMonthKey]);

    // Calculate Realized Time for current month
    const totalSeconds = entries
        .filter(e => dayjs(e.date).format('YYYY-MM') === currentMonthKey)
        .reduce((acc, curr) => acc + curr.duration, 0);
    
    const realizedHours = totalSeconds / 3600;
    const percentage = goalHours > 0 ? Math.min((realizedHours / goalHours) * 100, 100) : 0;
    const remainingSeconds = Math.max((goalHours * 3600) - totalSeconds, 0);

    if (goalHours === 0) {
        return (
             <Paper shadow="sm" radius="md" p="md" withBorder>
                <Group>
                    <ThemeIcon variant="light" color="gray" size="lg" radius="md">
                        <IconTargetArrow size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                         <Text size="sm" fw={500}>Nessun obiettivo fissato</Text>
                         <Text size="xs" c="dimmed">Vai in Impostazioni per impostare un obiettivo per {now.format('MMMM')}.</Text>
                    </Stack>
                </Group>
             </Paper>
        );
    }

    return (
        <Paper shadow="sm" radius="md" p="md" withBorder>
             <Group justify="space-between" align="flex-start" mb="md">
                 <Group gap="sm">
                    <ThemeIcon variant="light" color="indigo" size="lg" radius="md">
                        <IconTargetArrow size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase">Obiettivo {now.format('MMMM')}</Text>
                        <Text size="lg" fw={700}>{goalHours} Ore</Text>
                    </Stack>
                 </Group>
                 <BadgeDaysLeft days={daysRemaining} />
             </Group>

             {/* Responsive Grid: Stacks on mobile, Side-by-side on larger screens */}
             <Grid align="center" gutter="xl">
                 <Grid.Col span={{ base: 12, xs: 5 }}>
                    <Center>
                         <RingProgress 
                            size={140}
                            thickness={12}
                            roundCaps
                            sections={[{ value: percentage, color: 'indigo' }]}
                            label={
                                <Center>
                                    <Stack gap={0} align="center">
                                        <Text fw={700} size="xl">{percentage.toFixed(0)}%</Text>
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
                            value={formatTimeHours(totalSeconds)} 
                            color="teal"
                         />
                         <StatRow 
                            icon={<IconHourglassHigh size={16} />} 
                            label="Rimanente" 
                            value={formatTimeHours(remainingSeconds)} 
                            color="orange"
                         />
                     </Stack>
                 </Grid.Col>
             </Grid>
        </Paper>
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
