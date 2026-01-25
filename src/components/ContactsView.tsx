import { TextInput, Stack, Group, Paper, Text, Avatar, ActionIcon, ScrollArea, Button, Alert } from '@mantine/core';
import { IconSearch, IconX, IconDatabaseImport, IconInfoCircle } from '@tabler/icons-react';
import { useState, useMemo, useEffect } from 'react';
import type { ServiceEntry, Contact } from '../types';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { subscribeToGlobalContacts } from '../services/firestore';
import { migrateContactsToGlobalBook } from '../services/migration';

interface ContactsViewProps {
    entries: ServiceEntry[];
    onOpenContactDetail: (contact: Contact, entry: ServiceEntry | null) => void;
}

export default function ContactsView({ entries, onOpenContactDetail }: ContactsViewProps) {
    const { user } = useAuth();
    const [searchName, setSearchName] = useState('');
    
    // Global Contacts
    const [globalContacts, setGlobalContacts] = useState<Contact[]>([]);
    const [isMigrating, setIsMigrating] = useState(false);

    useEffect(() => {
        if (!user) return;
        return subscribeToGlobalContacts(user.uid, (data) => {
            setGlobalContacts(data as Contact[]);
        });
    }, [user]);

    const handleMigration = async () => {
        if (!user) return;
        if (!confirm("Avviare la migrazione? I contatti verranno unificati nella Rubrica Globale.")) return;
        
        setIsMigrating(true);
        try {
            const result = await migrateContactsToGlobalBook(user.uid);
            alert(`Migrazione completata! Creati ${result.newContactsCount} nuovi contatti globali.`);
        } catch (e) {
            console.error(e);
            alert("Errore durante la migrazione.");
        } finally {
            setIsMigrating(false);
        }
    };

    const filteredContacts = useMemo(() => {
        return globalContacts.filter((contact) => {
             const matchesName = searchName.trim() === '' || 
                `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchName.toLowerCase());
            return matchesName;
        });
    }, [globalContacts, searchName]);

    return (
        <Stack gap="md" h="100%">
             {/* Migration Prompt if empty */}
            {globalContacts.length === 0 && (
                <Alert variant="light" color="blue" title="Rubrica Globale Vuota" icon={<IconInfoCircle />}>
                    <Stack gap="xs">
                        <Text size="sm">
                            Sembra che tu non abbia ancora contatti nella nuova Rubrica Globale.
                            Puoi importare automaticamente tutti i contatti dalle tue visite passate.
                        </Text>
                        <Button 
                            leftSection={<IconDatabaseImport size={16} />} 
                            onClick={handleMigration} 
                            loading={isMigrating}
                            size="xs"
                        >
                            Importa Contatti
                        </Button>
                    </Stack>
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
