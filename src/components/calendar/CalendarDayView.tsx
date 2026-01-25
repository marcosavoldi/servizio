import { Card, Text, Stack, Group, Badge, ThemeIcon, ScrollArea, Menu, ActionIcon, Button, Divider } from '@mantine/core';
import type { ServiceEntry, Contact } from '../../types';
import dayjs from 'dayjs';
import { IconClock, IconManualGearbox, IconDotsVertical, IconEdit, IconTrash, IconUserPlus, IconUser, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { formatDuration } from '../../utils/formatUtils';
import AddContactModal from '../AddContactModal';
import ContactDetailModal from '../ContactDetailModal';
import { updateServiceEntry } from '../../services/firestore';

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

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedEntryForContact, setSelectedEntryForContact] = useState<ServiceEntry | null>(null);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContactForDetail, setSelectedContactForDetail] = useState<Contact | null>(null);
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<ServiceEntry | null>(null);

  const handleOpenAddContact = (entry: ServiceEntry) => {
      setSelectedEntryForContact(entry);
      setContactModalOpen(true);
  };

  const handleSaveContact = async (contact: Contact) => {
      if (!selectedEntryForContact || !selectedEntryForContact.id) return;
      
      const currentContacts = selectedEntryForContact.contacts || [];
      const updatedContacts = [...currentContacts, contact];
      
      try {
          await updateServiceEntry(selectedEntryForContact.id, {
              contacts: updatedContacts
          });
      } catch (e) {
          console.error("Error adding contact", e);
          alert("Errore nel salvataggio del contatto");
      }
  };

  const handleOpenContactDetail = (contact: Contact, entry: ServiceEntry) => {
      setSelectedContactForDetail(contact);
      setSelectedEntryForDetail(entry);
      setDetailModalOpen(true);
  };

  const handleUpdateContact = async (updatedContact: Contact) => {
      if (!selectedEntryForDetail || !selectedEntryForDetail.id) return;
      
      const currentContacts = selectedEntryForDetail.contacts || [];
      const updatedContacts = currentContacts.map(c => c.id === updatedContact.id ? updatedContact : c);
      
      try {
          await updateServiceEntry(selectedEntryForDetail.id, {
              contacts: updatedContacts
          });
      } catch (e) {
          console.error("Error updating contact", e);
          alert("Errore nell'aggiornamento del contatto");
      }
  };

  const handleDeleteContact = async () => {
      if (!selectedEntryForDetail || !selectedEntryForDetail.id || !selectedContactForDetail) return;
      
      const currentContacts = selectedEntryForDetail.contacts || [];
      const updatedContacts = currentContacts.filter(c => c.id !== selectedContactForDetail.id);
      
      try {
          await updateServiceEntry(selectedEntryForDetail.id, {
              contacts: updatedContacts
          });
          setDetailModalOpen(false);
      } catch (e) {
          console.error("Error deleting contact", e);
          alert("Errore nell'eliminazione del contatto");
      }
  }

  return (
    <Stack w="100%" maw={600} mx="auto" gap="sm">
      <Card bg="gray.1" padding="xs" radius="md" w="100%">
        <Group justify="space-between">
            <Text fw={700}>Totale giornaliero</Text>
            <Text fw={700} c="teal" size="lg">
                {formatDuration(totalDuration)}
            </Text>
        </Group>
      </Card>

      {dayEntries.length === 0 ? (
          <Text c="dimmed" ta="center" mt="xl">Nessuna attività registrata.</Text>
      ) : (
          <ScrollArea 
            type="always" 
            offsetScrollbars 
            mah={600} 
            w="100%" 
            scrollbarSize={14}
            styles={{ thumb: { borderRadius: 8 } }}
          >
              <Stack gap="sm" w="100%">
                  {dayEntries.sort((a,b) => a.startTime.seconds - b.startTime.seconds).map(entry => (
                      <Card key={entry.id} withBorder padding="md" radius="md" shadow="sm" w="100%">
                          <Stack gap="md">
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
                                              <Text size="sm" c="dimmed" mt={4} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
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

                              {/* Contacts Section */}
                              <Stack gap={0}>
                                  <Divider label="Contatti" labelPosition="left" mb="sm" />
                                  
                                  {entry.contacts && entry.contacts.length > 0 ? (
                                      <Stack gap="sm">
                                          {entry.contacts.map((contact, index) => (
                                              <Stack gap="xs" key={contact.id}>
                                                  {index > 0 && <Divider variant="dashed" color="gray.3" />}
                                                  <Group justify="space-between" wrap="nowrap" align="center">
                                                      <Group gap="sm" wrap="nowrap">
                                                          <ThemeIcon variant="light" color="gray" size="md" radius="xl">
                                                              <IconUser size={16} />
                                                          </ThemeIcon>
                                                          <Text size="sm" tt="capitalize" fw={600}>
                                                              {contact.firstName} {contact.lastName}
                                                          </Text>
                                                      </Group>
                                                      <ActionIcon 
                                                          variant="light" 
                                                          color="blue" 
                                                          size="lg" 
                                                          radius="xl"
                                                          onClick={() => handleOpenContactDetail(contact, entry)}
                                                      >
                                                          <IconSearch size={18} />
                                                      </ActionIcon>
                                                  </Group>
                                              </Stack>
                                          ))}
                                      </Stack>
                                  ) : (
                                      <Text size="xs" c="dimmed" fs="italic">Nessun contatto</Text>
                                  )}
                              </Stack>

                              {/* Add Contact Button */}
                              <Button 
                                  variant="light" 
                                  color="blue" 
                                  size="xs" 
                                  fullWidth
                                  mt="xs"
                                  leftSection={<IconUserPlus size={14} />}
                                  onClick={() => handleOpenAddContact(entry)}
                              >
                                  Aggiungi contatto
                              </Button>
                          </Stack>
                      </Card>
                  ))}
              </Stack>
          </ScrollArea>
      )}
      
      <AddContactModal 
        opened={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
        onSave={handleSaveContact} 
      />

      <ContactDetailModal 
        opened={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        contact={selectedContactForDetail}
        onUpdate={handleUpdateContact}
        onDelete={handleDeleteContact}
      />
    </Stack>
  );
}
