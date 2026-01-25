import { Modal, Group, Stack, Text, Switch, ActionIcon, Box, Badge, ScrollArea, Textarea, Button, Accordion } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import type { Contact, ContactNote } from '../types';
import CustomModalHeader from './common/CustomModalHeader';
import ContactForm from './ContactForm';
import type { ContactFormValues } from './ContactForm';
import dayjs from 'dayjs';

interface ContactDetailModalProps {
  opened: boolean;
  onClose: () => void;
  contact: Contact | null;
  onUpdate: (contact: Contact) => void;
  onDelete: () => void;
}

export default function ContactDetailModal({ opened, onClose, contact, onUpdate, onDelete }: ContactDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Reset state on close
  useEffect(() => {
      if (!opened) {
          setIsEditing(false);
          setNewNote('');
      }
  }, [opened]);

  // Normalize Notes to Array (Migration Logic)
  const notesList = useMemo<ContactNote[]>(() => {
      if (!contact) return [];
      
      if (Array.isArray(contact.notes)) {
          // Sort by date desc
          return [...contact.notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      const legacyNotes = [];
      if (typeof contact.notes === 'string' && contact.notes.trim()) {
          legacyNotes.push({
              id: 'legacy-notes',
              content: contact.notes,
              createdAt: new Date().toISOString() // We don't have original date, ideally maybe show "Legacy"
          });
      }
      
      // Also migrate old publications field if present and not empty
      if (contact.publications && contact.publications.trim()) {
           legacyNotes.push({
              id: 'legacy-pub',
              content: `[Legacy] ${contact.publications}`,
              createdAt: new Date().toISOString()
          });
      }

      return legacyNotes;
  }, [contact]);

  const handleUpdate = (values: ContactFormValues) => {
    if (!contact) return;
    const updatedContact: Contact = {
        ...contact,
        ...values
    };
    // ContactForm no longer handles notes, so existing notes (in ...contact) are preserved automatically.
    
    delete updatedContact.publications;
    onUpdate(updatedContact);
    setIsEditing(false);
  };

  const handleAddNote = () => {
      if (!contact || !newNote.trim()) return;
      
      const note: ContactNote = {
          id: Date.now().toString(),
          content: newNote.trim(),
          createdAt: new Date().toISOString()
      };

      const currentNotes = Array.isArray(contact.notes) ? contact.notes : notesList;
      const updatedNotes = [note, ...currentNotes];

      onUpdate({
          ...contact,
          notes: updatedNotes
      });
      setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
      if (!contact) return;
      if (!confirm("Eliminare questa nota?")) return;

      const currentNotes = Array.isArray(contact.notes) ? contact.notes : notesList;
      const updatedNotes = currentNotes.filter(n => n.id !== noteId);

      onUpdate({
          ...contact,
          notes: updatedNotes
      });
  };

  const handleDeleteConfirm = () => {
      if(confirm("Sei sicuro di voler eliminare questo contatto?")) {
          onDelete();
          onClose();
      }
  }

  // Memoize form values excluding notes
  const formInitialValues = useMemo(() => {
      if (!contact) return undefined;
      return {
          firstName: contact.firstName,
          lastName: contact.lastName,
          address: contact.address || '',
          phone: contact.phone || '',
          mobile: contact.mobile || '',
          email: contact.email || '',
          deliveredPublications: contact.deliveredPublications || []
      };
  }, [contact]);

  if (!contact) return null;

  return (
    <Modal 
        opened={opened} 
        onClose={onClose} 
        withCloseButton={false} 
        padding={0}
        size="md"
        centered
    >
      <Stack gap="sm">
          <CustomModalHeader title="Dettagli Contatto" onClose={onClose} />
          
          <Stack p="md" gap="md">
            {/* Toolbar */}
            <Group justify="space-between">
                <Switch 
                    label="Abilita Modifica" 
                    checked={isEditing} 
                    onChange={(event) => setIsEditing(event.currentTarget.checked)} 
                    color="teal"
                />
                <ActionIcon variant="light" color="red" onClick={handleDeleteConfirm} radius="md" size="lg">
                    <IconTrash size={20} />
                </ActionIcon>
            </Group>

            {isEditing ? (
                 <ContactForm 
                    initialValues={formInitialValues} 
                    onSave={handleUpdate} 
                    onCancel={() => setIsEditing(false)} 
                    submitLabel="Salva Modifiche"
                 />
            ) : (
                <ScrollArea.Autosize mah="60vh" type="auto" offsetScrollbars>
                    <Stack gap="lg">
                        <Stack gap="xs">
                            <Group>
                                <Text fw={700} size="lg" tt="capitalize">{contact.firstName} {contact.lastName}</Text>
                            </Group>
                            
                            {contact.address && (
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Indirizzo</Text>
                                    <Text>{contact.address}</Text>
                                </Box>
                            )}
                            
                            <Group grow>
                                 {contact.mobile && (
                                    <Box>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Cellulare</Text>
                                        <Text>{contact.mobile}</Text>
                                    </Box>
                                )}
                                {contact.phone && (
                                    <Box>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Telefono</Text>
                                        <Text>{contact.phone}</Text>
                                    </Box>
                                )}
                            </Group>

                            {contact.email && (
                                <Box>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Email</Text>
                                    <Text>{contact.email}</Text>
                                </Box>
                            )}
                            
                            {(contact.deliveredPublications && contact.deliveredPublications.length > 0) && (
                                <Box mt="xs">
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Pubblicazioni consegnate</Text>
                                    <Group gap={4} mt={4}>
                                        {contact.deliveredPublications.map((pub, idx) => (
                                            <Badge key={idx} variant="dot" color="blue" size="sm">{pub}</Badge>
                                        ))}
                                    </Group>
                                </Box>
                            )}
                        </Stack>

                        {/* Sequential Notes Section */}
                        <Stack gap="sm">
                            <Group justify="space-between" align="center">
                                <Text size="sm" fw={700} tt="uppercase" c="dimmed">Timeline Note</Text>
                            </Group>
                            
                            {/* Add Note */}
                            <Box>
                                <Textarea 
                                    placeholder="Scrivi una nuova nota..." 
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.currentTarget.value)}
                                    autosize
                                    minRows={2}
                                />
                                <Group justify="flex-end" mt="xs">
                                    <Button 
                                        size="xs" 
                                        leftSection={<IconPlus size={14} />} 
                                        disabled={!newNote.trim()}
                                        onClick={handleAddNote}
                                    >
                                        Aggiungi
                                    </Button>
                                </Group>
                            </Box>

                            {/* Timeline / Accordion */}
                            {notesList.length > 0 ? (
                                <Accordion variant="separated" radius="md" chevronPosition="right">
                                    {notesList.map((note) => (
                                        <Accordion.Item key={note.id} value={note.id} bg="var(--mantine-color-gray-0)">
                                            <Accordion.Control>
                                                <Group justify="space-between" pr="xs">
                                                    <Text size="sm" fw={600}>{dayjs(note.createdAt).format('D MMM YYYY - HH:mm')}</Text>
                                                </Group>
                                            </Accordion.Control>
                                            <Accordion.Panel>
                                                <Stack gap="xs">
                                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                        {note.content}
                                                    </Text>
                                                    <Group justify="flex-end">
                                                        <ActionIcon 
                                                            variant="subtle" 
                                                            color="red" 
                                                            size="sm"
                                                            onClick={() => handleDeleteNote(note.id)}
                                                        >
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Stack>
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            ) : (
                                <Text size="xs" c="dimmed" ta="center">Nessuna nota presente.</Text>
                            )}
                        </Stack>
                    </Stack>
                </ScrollArea.Autosize>
            )}
          </Stack>
      </Stack>
    </Modal>
  );
}
