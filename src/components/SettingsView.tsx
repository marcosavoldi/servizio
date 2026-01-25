import { Stack, Paper, Text, Group, TextInput, ActionIcon, Title, ScrollArea } from '@mantine/core';
import { IconPlus, IconTrash, IconBook } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { updatePublicationCatalog, subscribeToUserSettings } from '../services/firestore';
import { useAuth } from '../context/AuthContext';

export default function SettingsView() {
    const { user } = useAuth();
    const [catalog, setCatalog] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToUserSettings(user.uid, (settings) => {
            setCatalog(settings.publicationCatalog);
        });
        return () => unsubscribe();
    }, [user]);

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

    return (
        <Stack gap="md" h="100%">
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
            
            <ScrollArea h="calc(100vh - 300px)" type="auto" offsetScrollbars>
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
