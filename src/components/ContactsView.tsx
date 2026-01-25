import { TextInput, Stack, Group, Paper, Text, Avatar, ActionIcon, ScrollArea, Alert } from '@mantine/core';
import { IconSearch, IconX, IconInfoCircle } from '@tabler/icons-react';
import { useState, useMemo, useEffect } from 'react';
import type { ServiceEntry, Contact } from '../types';
import { useAuth } from '../context/AuthContext';
import { subscribeToGlobalContacts } from '../services/firestore';

interface ContactsViewProps {
    onOpenContactDetail: (contact: Contact, entry: ServiceEntry | null) => void;
}

export default function ContactsView({ onOpenContactDetail }: ContactsViewProps) {
    const { user } = useAuth();
    const [searchName, setSearchName] = useState('');
    
    // Global Contacts
    const [globalContacts, setGlobalContacts] = useState<Contact[]>([]);

    useEffect(() => {
        if (!user) return;
        return subscribeToGlobalContacts(user.uid, (data) => {
            setGlobalContacts(data as Contact[]);
        });
    }, [user]);

    const filteredContacts = useMemo(() => {
        return globalContacts.filter((contact) => {
             const matchesName = searchName.trim() === '' || 
                `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchName.toLowerCase());
            return matchesName;
        });
    }, [globalContacts, searchName]);

    return (
        <Stack gap="md" h="100%">
             {/* Empty State Prompt */}
            {globalContacts.length === 0 && (
                <Alert variant="light" color="blue" title="Rubrica Globale Vuota" icon={<IconInfoCircle />}>
                    <Text size="sm">
                        Non hai ancora contatti nella Rubrica Globale.
                    </Text>
                </Alert>
            )}

            {/* Filters */}
            <Paper p="md" radius="md" withBorder>
                <Stack gap="sm">
                    <Text fw={700} size="lg">Rubrica Contatti</Text>
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
                    </Group>
                </Stack>
            </Paper>

            {/* List */}
            <ScrollArea h="calc(100vh - 200px)" type="always" offsetScrollbars>
                {filteredContacts.length === 0 ? (
                    <Text c="dimmed" ta="center" mt="xl">Nessun contatto trovato.</Text>
                ) : (
                    <Stack gap="sm">
                        {filteredContacts.map((contact) => (
                            <Paper 
                                key={contact.id} 
                                p="sm" 
                                radius="md" 
                                withBorder 
                                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                onClick={() => onOpenContactDetail(contact, null)}
                                bg="white"
                            >
                                <Group justify="space-between" align="center">
                                    <Group gap="sm">
                                        <Avatar color="teal" radius="xl">
                                            {contact.firstName[0]?.toUpperCase()}{contact.lastName[0]?.toUpperCase()}
                                        </Avatar>
                                        <div>
                                            <Text fw={600} tt="capitalize">{contact.firstName} {contact.lastName}</Text>
                                            {contact.address && <Text size="xs" c="dimmed">{contact.address}</Text>}
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
