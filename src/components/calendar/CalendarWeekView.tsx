import { Text, Group, SimpleGrid, Paper, Stack, Badge, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ServiceEntry } from '../../types';
import dayjs from 'dayjs';

import { formatDuration } from '../../utils/formatUtils';

interface CalendarWeekViewProps {
  currentDate: Date;
  entries: ServiceEntry[];
  onSelectDate: (date: Date) => void;
}

export default function CalendarWeekView({ currentDate, entries, onSelectDate }: CalendarWeekViewProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Find start of week (Monday)
  const startOfWeek = dayjs(currentDate).startOf('week'); 
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

  const getEntriesForDate = (date: dayjs.Dayjs) => {
      const dateStr = date.format('YYYY-MM-DD');
      return entries.filter(e => e.date === dateStr);
  };

  const getTotalForDate = (dayEntries: ServiceEntry[]) => {
      return dayEntries.reduce((acc, curr) => acc + curr.duration, 0);
  };

  // Calculate Weekly Total
  const weeklyTotal = entries.reduce((acc, entry) => {
      // Check if entry date is within this week
      const entryDate = dayjs(entry.date);
      // isBetween is robust but strict, simpler is checking if it falls in [startOfWeek, endOfWeek]
      // dayjs/plugin/isBetween might not be imported. Let's stick to comparing day diffs or simple logic
      if (entryDate.isAfter(startOfWeek.subtract(1, 'minute')) && entryDate.isBefore(startOfWeek.add(7, 'day'))) {
          return acc + entry.duration;
      }
      return acc;
  }, 0);

  // Mobile View: List
  if (isMobile) {
      return (
        <Stack gap="xs">
            <Paper shadow="xs" p="sm" radius="md" withBorder mb="xs">
                <Group justify="space-between">
                    <Text fw={700}>Totale settimanale</Text>
                    <Text fw={700} c="teal" size="lg">
                        {formatDuration(weeklyTotal)}
                    </Text>
                </Group>
            </Paper>
            {weekDays.map((day) => {
                const dayEntries = getEntriesForDate(day);
                const total = getTotalForDate(dayEntries);
                const isToday = day.isSame(dayjs(), 'day');
                
                return (
                    <Paper 
                        key={day.toString()} 
                        withBorder 
                        p="sm" 
                        radius="md"
                        onClick={() => onSelectDate(day.toDate())}
                        style={{ 
                            cursor: 'pointer',
                            borderColor: isToday ? 'var(--mantine-color-teal-5)' : undefined,
                            backgroundColor: isToday ? 'var(--mantine-color-teal-0)' : undefined
                        }}
                    >
                        <Group justify="space-between" align="center">
                            <Group>
                                <Stack gap={0} align="center" bg="gray.1" p={8} style={{ borderRadius: 8, minWidth: 50 }}>
                                    <Text size="xs" c="dimmed" tt="uppercase" lh={1}>{day.format('ddd')}</Text>
                                    <Text fw={700} size="lg" lh={1}>{day.format('D')}</Text>
                                </Stack>
                                <div>
                                    <Text size="sm" fw={500}>{day.format('D MMMM')}</Text>
                                    <Text size="xs" c="dimmed">
                                        {dayEntries.length > 0 ? `${dayEntries.length} attività` : 'Nessuna attività'}
                                    </Text>
                                </div>
                            </Group>
                            
                            {total > 0 && (
                                <Badge variant="light" color="teal" size="lg">
                                    {formatDuration(total)}
                                </Badge>
                            )}
                        </Group>
                    </Paper>
                );
            })}
        </Stack>
      );
  }

  // Desktop View: Grid
  return (
    <Stack gap="md">
        <Paper shadow="xs" p="sm" radius="md" withBorder>
            <Group justify="space-between">
                <Text fw={700}>Totale settimanale</Text>
                <Text fw={700} c="teal" size="lg">
                    {formatDuration(weeklyTotal)}
                </Text>
            </Group>
        </Paper>
        <SimpleGrid cols={7} spacing="xs">
            {weekDays.map((day) => {
            const dayEntries = getEntriesForDate(day);
            const total = getTotalForDate(dayEntries);
            const isToday = day.isSame(dayjs(), 'day');
            
            return (
                <Paper 
                    key={day.toString()} 
                    withBorder 
                    p="xs" 
                    radius="md"
                    h={120} // Fixed height for desktop grid cells
                    onClick={() => onSelectDate(day.toDate())}
                    style={{ 
                        cursor: 'pointer',
                        borderColor: isToday ? 'var(--mantine-color-teal-5)' : undefined,
                        backgroundColor: isToday ? 'var(--mantine-color-teal-0)' : undefined,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase">{day.format('ddd')}</Text>
                        <Text fw={700} size="md">{day.format('D MMM')}</Text>
                    </Stack>
                    
                    {total > 0 ? (
                         <Box bg="teal.1" c="teal.9" style={{ borderRadius: 4, textAlign: 'center', padding: '4px 0' }}>
                             <Text size="xs" fw={700}>{formatDuration(total)}</Text>
                         </Box>
                    ) : (
                        <Box h={24} />
                    )}
                </Paper>
            );
        })}
    </SimpleGrid>
    </Stack>
  );
}
