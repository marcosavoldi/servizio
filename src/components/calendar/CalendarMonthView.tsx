import { Paper, Stack, Modal, ActionIcon, Group, Text, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Calendar } from '@mantine/dates';
import type { ServiceEntry } from '../../types';
import dayjs from 'dayjs';
import { useState } from 'react';
import CalendarDayView from './CalendarDayView';
import { IconPlus, IconX } from '@tabler/icons-react';

interface CalendarMonthViewProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void; 
  entries: ServiceEntry[];
  onEdit: (entry: ServiceEntry) => void;
  onDelete: (id: string) => void;
  onAddEntry: (date: Date) => void;
}

export default function CalendarMonthView({ currentDate, entries, onEdit, onDelete, onAddEntry }: CalendarMonthViewProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedDayModal, setSelectedDayModal] = useState<Date | null>(null);

  const entriesByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, ServiceEntry[]>);

  // Calculate Monthly Total
  const currentMonthEntries = entries.filter(entry => {
      const entryDate = dayjs(entry.date);
      return entryDate.month() === dayjs(currentDate).month() && entryDate.year() === dayjs(currentDate).year();
  });
  
  const monthlyTotalSeconds = currentMonthEntries.reduce((acc, curr) => acc + curr.duration, 0);
  
  const formatDuration = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
  };

  const renderDay = (date: Date) => {
    const d = dayjs(date);
    const dateStr = d.format('YYYY-MM-DD');
    const dayEntries = entriesByDate[dateStr] || [];
    const hasEntries = dayEntries.length > 0;
    
    return (
      <div 
        onClick={(e) => {
             e.stopPropagation();
             setSelectedDayModal(date);
        }}
        style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            borderBottom: hasEntries ? '3px solid var(--mantine-color-teal-5)' : undefined,
            borderRadius: hasEntries ? '0' : '4px' // Square bottom if underlined
        }}
      >
        {d.date()}
      </div>
    );
  };

  return (
    <Stack gap="sm" w="100%">
      <Paper shadow="xs" p="sm" radius="md" withBorder>
         <Group justify="space-between">
            <Text fw={700}>Totale mensile</Text>
            <Text fw={700} c="teal" size="lg">
                {formatDuration(monthlyTotalSeconds)}
            </Text>
         </Group>
      </Paper>

      <Paper shadow="xs" p={isMobile ? 'xs' : 'md'} radius="md" withBorder>
         <Stack align="center">
          <Calendar 
              static
              date={currentDate}
              onDateChange={(date) => {
                  // Ensure we get a valid date object
                  const d = dayjs(date as any).toDate();
                  setSelectedDayModal(d);
                  // We also notify parent to keep synced, but maybe we don't need to navigate
                  // onSelectDate(d); 
              }} 
              renderDay={(date) => renderDay(date as any)}
              locale="it"
              size={isMobile ? 'md' : 'lg'}
              styles={{
                  day: { borderRadius: 8 },
                  calendarHeader: { maxWidth: '100%' }
              }}
          />
         </Stack>
      </Paper>
      
      <Modal 
          opened={!!selectedDayModal} 
          onClose={() => setSelectedDayModal(null)} 
          withCloseButton={false}
          title={null}
          centered
          size="lg"
          padding={0} // We'll handle padding in the content
      >
        <Stack gap="xs">
            {/* Custom Header */}
            <Group justify="space-between" align="start" p="md" pb="xs" w="100%" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={700} size="xl" tt="capitalize" lh={1.2}>
                        {selectedDayModal ? dayjs(selectedDayModal).format('dddd D') : ''} 
                    </Text>
                    <Text size="md" c="dimmed" tt="capitalize" lh={1.2}>
                        {selectedDayModal ? dayjs(selectedDayModal).format('MMMM YYYY') : ''}
                    </Text>
                </Box>
                <Group gap="sm" wrap="nowrap">
                    <ActionIcon 
                        variant="filled" 
                        color="green" 
                        size="lg" 
                        radius="md"
                        onClick={() => {
                            if (selectedDayModal) {
                                onAddEntry(selectedDayModal);
                                setSelectedDayModal(null);
                            }
                        }}
                    >
                        <IconPlus size={22} stroke={2.5} />
                    </ActionIcon>
                    <ActionIcon 
                        variant="light" 
                        color="red" 
                        size="lg" 
                        radius="md"
                        onClick={() => setSelectedDayModal(null)}
                    >
                        <IconX size={22} stroke={2.5} />
                    </ActionIcon>
                </Group>
            </Group>

            {/* Content */}
            <Box p="md" pt={0}>
                {selectedDayModal && (
                    <CalendarDayView 
                        currentDate={selectedDayModal} 
                        entries={entries} 
                        onEdit={(entry) => {
                            onEdit(entry);
                            setSelectedDayModal(null); 
                        }}
                        onDelete={onDelete}
                    />
                )}
            </Box>
        </Stack>
      </Modal>
    </Stack>
  );
}
