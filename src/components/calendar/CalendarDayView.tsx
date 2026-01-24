import { Card, Text, Stack, Group, Badge, ThemeIcon, ScrollArea, Menu, ActionIcon } from '@mantine/core';
import type { ServiceEntry } from '../../types';
import dayjs from 'dayjs';
import { IconClock, IconManualGearbox, IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react';

import { formatDuration } from '../../utils/formatUtils';

interface CalendarDayViewProps {
  currentDate: Date;
  entries: ServiceEntry[];
  onEdit: (entry: ServiceEntry) => void;
  onDelete: (id: string) => void;
}

export default function CalendarDayView({ currentDate, entries, onEdit, onDelete }: CalendarDayViewProps) {
  
  const dateStr = dayjs(currentDate).format('YYYY-MM-DD');
  const dayEntries = entries.filter(e => e.date === dateStr);
  const totalDuration = dayEntries.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <Stack>
      <Card bg="gray.1" padding="xs" radius="md">
        <Group justify="space-between">
            <Text fw={700}>Totale giornaliero</Text>
            <Text fw={700} c="teal" size="lg">
                {formatDuration(totalDuration)}
            </Text>
        </Group>
      </Card>

      <ScrollArea h={400} type="always" offsetScrollbars>
        {dayEntries.length === 0 ? (
            <Text c="dimmed" ta="center" mt="xl">Nessuna attività registrata.</Text>
        ) : (
            <Stack gap="sm" w="100%" maw={600} mx="auto">
                {dayEntries.sort((a,b) => a.startTime.seconds - b.startTime.seconds).map(entry => (
                    <Card key={entry.id} withBorder padding="sm" radius="md" shadow="sm" w="100%">
                        <Group justify="space-between" align="start" wrap="nowrap">
                            <Group align="flex-start" wrap="nowrap" style={{ flex: 1 }}>
                                <ThemeIcon size="lg" variant="light" color={entry.type === 'timer' ? 'blue' : 'orange'}>
                                    {entry.type === 'timer' ? <IconClock size={16}/> : <IconManualGearbox size={16}/>}
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" fw={700}>
                                        {dayjs(entry.startTime.toDate()).format('HH:mm')} - {dayjs(entry.endTime.toDate()).format('HH:mm')}
                                    </Text>
                                    {entry.notes && (
                                        <Text size="xs" c="dimmed" lineClamp={2} style={{ whiteSpace: 'pre-wrap' }}>
                                            {entry.notes}
                                        </Text>
                                    )}
                                </div>
                            </Group>
                            
                            <Stack align="flex-end" gap={4}>
                                <Badge size="md" variant="dot" color="teal">
                                    {formatDuration(entry.duration)}
                                </Badge>
                                
                                <Menu shadow="md" width={140} position="bottom-end">
                                    <Menu.Target>
                                        <ActionIcon variant="subtle" color="gray" size="sm">
                                            <IconDotsVertical size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item leftSection={<IconEdit size={14}/>} onClick={() => onEdit(entry)}>
                                            Modifica
                                        </Menu.Item>
                                        <Menu.Item leftSection={<IconTrash size={14}/>} color="red" onClick={() => entry.id && onDelete(entry.id)}>
                                            Elimina
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Stack>
                        </Group>
                    </Card>
                ))}
            </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
}
