import { AppShell, Burger, Group, Title, Button, Container, Tabs, Paper, ActionIcon, Stack, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../context/AuthContext';
import ServiceTimer from '../components/ServiceTimer';
import CalendarView from '../components/CalendarView';
import ManualEntryModal from '../components/ManualEntryModal';
import ContactsView from '../components/ContactsView';
import ContactDetailModal from '../components/ContactDetailModal';
import { useState, useEffect } from 'react';
import { IconClock, IconCalendar, IconPlus, IconUsers, IconHome, IconLogout, IconSettings } from '@tabler/icons-react';
import { subscribeToMonthEntries, updateServiceEntry } from '../services/firestore';
import type { ServiceEntry, Contact } from '../types';
import SettingsView from '../components/SettingsView';

type MainView = 'dashboard' | 'contacts' | 'settings';

export default function Home() {
  const [opened, { toggle }] = useDisclosure();
  const { logout, user } = useAuth();
  
  const [mainView, setMainView] = useState<MainView>('dashboard');
  const [activeTab, setActiveTab] = useState<string | null>('timer');
  
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState<Date | null>(null);
  const [entries, setEntries] = useState<ServiceEntry[]>([]);
  
  // Contact Detail State (Shared)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContactForDetail, setSelectedContactForDetail] = useState<Contact | null>(null);
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<ServiceEntry | null>(null);

  // Fetch entries
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMonthEntries(user.uid, new Date(), new Date(), (data) => {
        setEntries(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleOpenAddEntry = (date?: Date) => {
      setEntryDate(date || new Date());
      setManualModalOpen(true);
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
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                <Title order={3} size="h4">Agenda Servizio</Title>
            </Group>
             <ActionIcon variant="filled" color="green" size="lg" radius="md" onClick={() => handleOpenAddEntry()}>
                <IconPlus size={24} stroke={2.5} />
             </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs" style={{ flex: 1 }}>
            <Title order={6} c="dimmed" tt="uppercase">Menu</Title>
            <NavLink 
                label="Home" 
                leftSection={<IconHome size={20} />} 
                active={mainView === 'dashboard'}
                onClick={() => { setMainView('dashboard'); toggle(); }}
                variant="light"
            />
            <NavLink 
                label="Contatti" 
                leftSection={<IconUsers size={20} />} 
                active={mainView === 'contacts'}
                onClick={() => { setMainView('contacts'); toggle(); }}
                variant="light"
            />
            <NavLink 
                label="Impostazioni" 
                leftSection={<IconSettings size={20} />} 
                active={mainView === 'settings'}
                onClick={() => { setMainView('settings'); toggle(); }}
                variant="light"
            />
        </Stack>

        <Button variant="light" color="red" leftSection={<IconLogout size={18}/>} onClick={logout} fullWidth>
          Esci
        </Button>
      </AppShell.Navbar>

      <AppShell.Main pb={80}>
        <Container size="md" mt="md" p={0}>
            {mainView === 'dashboard' ? (
                <Tabs value={activeTab} onChange={setActiveTab} variant="default" radius="md" defaultValue="timer" keepMounted={false}>
                    <Tabs.List grow mb={30} pb="lg" style={{ borderBottom: 'none' }}>
                        <Paper withBorder radius="xl" p={4} bg="var(--mantine-color-gray-0)" w="100%">
                            <Group gap={0} grow>
                                <Button 
                                    variant={activeTab === 'timer' ? 'white' : 'subtle'} 
                                    color="gray" 
                                    radius="xl"
                                    size="sm"
                                    onClick={() => setActiveTab('timer')}
                                    leftSection={<IconClock size={16}/>}
                                    style={{ boxShadow: activeTab === 'timer' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                >
                                    Oggi
                                </Button>
                                <Button 
                                    variant={activeTab === 'calendar' ? 'white' : 'subtle'} 
                                    color="gray" 
                                    radius="xl"
                                    size="sm"
                                    onClick={() => setActiveTab('calendar')}
                                    leftSection={<IconCalendar size={16}/>}
                                    style={{ boxShadow: activeTab === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                >
                                    Calendario
                                </Button>
                            </Group>
                        </Paper>
                    </Tabs.List>

                    <Tabs.Panel value="timer" pt="xs">
                        <ServiceTimer onEntrySaved={() => setActiveTab('calendar')} />
                    </Tabs.Panel>

                    <Tabs.Panel value="calendar">
                        <CalendarView entries={entries} onAddEntry={handleOpenAddEntry} />
                    </Tabs.Panel>
                </Tabs>
            ) : mainView === 'contacts' ? (
                <ContactsView entries={entries} onOpenContactDetail={handleOpenContactDetail} />
            ) : (
                <SettingsView />
            )}
        </Container>
      </AppShell.Main>

      <ManualEntryModal 
        opened={manualModalOpen} 
        onClose={() => setManualModalOpen(false)} 
        initialDate={entryDate}
        onEntrySaved={() => {}} 
      />

      <ContactDetailModal 
        opened={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        contact={selectedContactForDetail}
        onUpdate={handleUpdateContact}
        onDelete={handleDeleteContact}
      />
    </AppShell>
  );
}
