import { Stack, Title } from '@mantine/core';
import ServiceTimerWidget from './ServiceTimerWidget';
import MonthlyGoalWidget from './MonthlyGoalWidget';
import type { ServiceEntry } from '../types';

interface DashboardViewProps {
    entries: ServiceEntry[];
    onEntrySaved?: () => void;
}

export default function DashboardView({ entries, onEntrySaved }: DashboardViewProps) {
    return (
        <Stack mt="md" gap="md">
            <Title order={3} mb="xs">Panoramica</Title>
            <ServiceTimerWidget onEntrySaved={onEntrySaved || (() => {})} />
            <MonthlyGoalWidget entries={entries} />
        </Stack>
    );
}
