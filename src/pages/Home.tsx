import { AppShell, Burger, Group, Title, Button, Container, ActionIcon, Stack, NavLink, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../context/AuthContext';
import CalendarView from '../components/CalendarView';
import ManualEntryModal from '../components/ManualEntryModal';
import ContactsView from '../components/ContactsView';
import ContactDetailModal from '../components/ContactDetailModal';
import { useState, useEffect } from 'react';
import UserGuideView from '../components/UserGuideView';
import { IconCalendar, IconPlus, IconUsers, IconHome, IconLogout, IconSettings, IconArrowLeft, IconArrowRight, IconBook } from '@tabler/icons-react';
import { subscribeToMonthEntries, updateServiceEntry } from '../services/firestore';
import type { ServiceEntry, Contact } from '../types';
import NetworkStatus from '../components/NetworkStatus';
import SettingsView from '../components/SettingsView';
import { useInternalNavigation } from '../hooks/useInternalNavigation';
import DashboardView from '../components/DashboardView';

export default function Home() {
  const [opened, { toggle, close }] = useDisclosure();
  const { logout, user } = useAuth();
  
  // Navigation
  const { currentView, navigate, goBack, goForward, canGoBack, canGoForward } = useInternalNavigation();
  
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
      footer={{ height: 50 }}
      navbar={{ width: 300, breakpoint: 'md', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
                <Title order={3} size="h4">Agenda Servizio</Title>
            </Group>
             <Group gap="xs">
                 <NetworkStatus />
                 <ActionIcon 
                    variant="light" 
                    color="blue" 
                    size="lg" 
                    radius="md" 
                    onClick={() => { navigate('dashboard'); close(); }}
                 >
                    <IconHome size={22} stroke={2.5} />
                 </ActionIcon>
                 <ActionIcon 
                    variant="light" 
                    color="green" 
                    size="lg" 
                    radius="md" 
                    onClick={() => handleOpenAddEntry()}
                 >
                    <IconPlus size={22} stroke={2.5} />
                 </ActionIcon>
             </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs" style={{ flex: 1 }}>
            <Title order={6} c="dimmed" tt="uppercase">Menu</Title>
            <NavLink 
                label="Home" 
                leftSection={<IconHome size={20} />} 
                active={currentView === 'dashboard'}
                onClick={() => { navigate('dashboard'); toggle(); }}
                variant="light"
            />
            <NavLink 
                label="Calendario" 
                leftSection={<IconCalendar size={20} />} 
                active={currentView === 'calendar'}
                onClick={() => { navigate('calendar'); toggle(); }}
                variant="light"
            />
            <NavLink 
                label="Contatti" 
                leftSection={<IconUsers size={20} />} 
                active={currentView === 'contacts'}
                onClick={() => { navigate('contacts'); toggle(); }}
                variant="light"
            />
             <NavLink 
                label="Manuale Utente" 
                leftSection={<IconBook size={20} />} 
                active={currentView === 'guide'}
                onClick={() => { navigate('guide'); toggle(); }}
                variant="light"
            />
            <NavLink 
                label="Impostazioni" 
                leftSection={<IconSettings size={20} />} 
                active={currentView === 'settings'}
                onClick={() => { navigate('settings'); toggle(); }}
                variant="light"
            />
        </Stack>

        <Button variant="light" color="red" leftSection={<IconLogout size={18}/>} onClick={logout} fullWidth>
          Esci
        </Button>
      </AppShell.Navbar>

      <AppShell.Main pt={60} pb={50}>
        <ScrollArea h="calc(100vh - 110px)" type="always" offsetScrollbars>
            <Container size="md" mt="md" p={0}>
                {currentView === 'dashboard' ? (
                    <DashboardView entries={entries} />
                ) : currentView === 'calendar' ? (
                    <CalendarView entries={entries} onAddEntry={handleOpenAddEntry} />
                ) : currentView === 'contacts' ? (
                    <ContactsView entries={entries} onOpenContactDetail={handleOpenContactDetail} />
                ) : currentView === 'guide' ? (
                    <UserGuideView />
                ) : (
                    <SettingsView />
                )}
            </Container>
        </ScrollArea>
      </AppShell.Main>

      <AppShell.Footer p="xs">
         <Group justify="center" gap="xl">
             <ActionIcon 
                variant="light" 
                color="blue" 
                size="lg" 
                radius="md"
                onClick={goBack}
                disabled={!canGoBack}
             >
                <IconArrowLeft size={24} />
             </ActionIcon>
             
             <ActionIcon 
                variant="light" 
                color="blue" 
                size="lg" 
                radius="md"
                onClick={goForward}
                disabled={!canGoForward}
             >
                <IconArrowRight size={24} />
             </ActionIcon>
         </Group>
      </AppShell.Footer>

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
