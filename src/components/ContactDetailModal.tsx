import { Modal, Group, Stack, Text, Switch, ActionIcon, Box, Badge, ScrollArea } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import type { Contact } from '../types';
import CustomModalHeader from './common/CustomModalHeader';
import ContactForm from './ContactForm';
import type { ContactFormValues } from './ContactForm';

interface ContactDetailModalProps {
  opened: boolean;
  onClose: () => void;
  contact: Contact | null;
  onUpdate: (contact: Contact) => void;
  onDelete: () => void;
}

export default function ContactDetailModal({ opened, onClose, contact, onUpdate, onDelete }: ContactDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Reset editing state on close
  useEffect(() => {
      if (!opened) {
          setIsEditing(false);
      }
  }, [opened]);

  const handleUpdate = (values: ContactFormValues) => {
    if (!contact) return;
    const updatedContact: Contact = {
        ...contact,
        ...values
    };
    // Explicitly remove legacy field so it is not sent as undefined to Firestore
    delete updatedContact.publications;
    
    onUpdate(updatedContact);
    setIsEditing(false);
  };

  const handleDeleteConfirm = () => {
      if(confirm("Sei sicuro di voler eliminare questo contatto?")) {
          onDelete();
          onClose();
      }
  }

  // Memoize initial form values including migration logic
  const formInitialValues = useMemo(() => {
      if (!contact) return undefined;
      return {
          firstName: contact.firstName,
          lastName: contact.lastName,
          address: contact.address || '',
          phone: contact.phone || '',
          mobile: contact.mobile || '',
          email: contact.email || '',
          // Migration logic here
          notes: contact.notes || (contact.publications ? `[Legacy] ${contact.publications}` : ''),
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

                        {/* Delivered Publications */}
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

                        {/* Notes (or Legacy) */}
                        {(contact.notes || contact.publications) && (
                            <Box mt="xs">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Note</Text>
                                <Text style={{ whiteSpace: 'pre-wrap' }}>
                                    {contact.notes || contact.publications}
                                </Text>
                            </Box>
                        )}
                    </Stack>
                </ScrollArea.Autosize>
            )}
          </Stack>
      </Stack>
    </Modal>
  );
}
