import { TextInput, Stack, Group, Paper, Text, Avatar, ActionIcon, ScrollArea } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconSearch, IconX, IconCalendar } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import type { ServiceEntry, Contact } from '../types';
import dayjs from 'dayjs';

interface ContactsViewProps {
    entries: ServiceEntry[];
    onOpenContactDetail: (contact: Contact, entry: ServiceEntry) => void;
}

export default function ContactsView({ entries, onOpenContactDetail }: ContactsViewProps) {
    const [searchName, setSearchName] = useState('');
    const [searchDate, setSearchDate] = useState<Date | null>(null);

    const allContacts = useMemo(() => {
        return entries
            .flatMap(entry => (entry.contacts || []).map(contact => ({ contact, entry })))
            .sort((a, b) => b.entry.startTime.seconds - a.entry.startTime.seconds); // Most recent first
    }, [entries]);

    const filteredContacts = useMemo(() => {
        return allContacts.filter(({ contact, entry }) => {
            const matchesName = searchName.trim() === '' || 
                `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchName.toLowerCase());
            
            const matchesDate = !searchDate || 
                entry.date === dayjs(searchDate).format('YYYY-MM-DD');

            return matchesName && matchesDate;
        });
    }, [allContacts, searchName, searchDate]);

    return (
        <Stack gap="md" h="100%">
            {/* Filters */}
            <Paper p="md" radius="md" withBorder>
                <Stack gap="sm">
                    <Text fw={700} size="lg">Elenco Contatti</Text>
                    <Group grow preventGrowOverflow={false} wrap="wrap">
                        <TextInput 
                            placeholder="Cerca per nome..." 
                            leftSection={<IconSearch size={16} />} 
                            value={searchName}
                            onChange={(e) => setSearchName(e.currentTarget.value)}
                            rightSection={
                                searchName ? 
                                <ActionIcon variant="subtle" color="gray" onClick={() => setSearchName('')}><IconX size={14}/></ActionIcon> 
                                : null
                            }
                        />
                        <DateInput 
                            placeholder="Filtra per data" 
                            leftSection={<IconCalendar size={16} />}
                            value={searchDate}
                            onChange={(date) => setSearchDate(date as Date | null)}
                            clearable
                            locale="it"
                            valueFormat="DD MMMM YYYY"
                        />
                    </Group>
                </Stack>
            </Paper>

            {/* List */}
            <ScrollArea h="calc(100vh - 200px)" type="always" offsetScrollbars>
                {filteredContacts.length === 0 ? (
                    <Text c="dimmed" ta="center" mt="xl">Nessun contatto trovato con questi filtri.</Text>
                ) : (
                    <Stack gap="sm">
                        {filteredContacts.map(({ contact, entry }, index) => (
                            <Paper 
                                key={`${contact.id}-${index}`} 
                                p="sm" 
                                radius="md" 
                                withBorder 
                                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                onClick={() => onOpenContactDetail(contact, entry)}
                                bg="white"
                            >
                                <Group justify="space-between" align="center">
                                    <Group gap="sm">
                                        <Avatar color="blue" radius="xl">
                                            {contact.firstName[0]?.toUpperCase()}{contact.lastName[0]?.toUpperCase()}
                                        </Avatar>
                                        <div>
                                            <Text fw={600} tt="capitalize">{contact.firstName} {contact.lastName}</Text>
                                            <Text size="xs" c="dimmed">
                                                Incontrato il {dayjs(entry.date).format('D MMMM YYYY')}
                                            </Text>
                                        </div>
                                    </Group>
                                    <IconSearch size={18} color="var(--mantine-color-gray-5)" />
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </ScrollArea>
        </Stack>
    );
}
