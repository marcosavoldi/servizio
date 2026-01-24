import { AppShell, Burger, Group, Title, Button, Container, Tabs, Paper, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../context/AuthContext';
import ServiceTimer from '../components/ServiceTimer';
import CalendarView from '../components/CalendarView';
import ManualEntryModal from '../components/ManualEntryModal';
import { useState, useEffect } from 'react';
import { IconClock, IconCalendar, IconPlus } from '@tabler/icons-react';
import { subscribeToMonthEntries } from '../services/firestore';
import type { ServiceEntry } from '../types';

export default function Home() {
  const [opened, { toggle }] = useDisclosure();
  const { logout, user } = useAuth();

  
  const [activeTab, setActiveTab] = useState<string | null>('timer');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState<Date | null>(null);
  const [entries, setEntries] = useState<ServiceEntry[]>([]);
  
  // Fetch entries (simple: all user entries for now, optimize later)
  useEffect(() => {
    if (!user) return;
    // For now, getting "Month" entries but we aren't filtering dates strictly in service yet, simplified to all recent.
    const unsubscribe = subscribeToMonthEntries(user.uid, new Date(), new Date(), (data) => {
        setEntries(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleOpenAddEntry = (date?: Date) => {
      setEntryDate(date || new Date());
      setManualModalOpen(true);
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
            {/* Quick add button visible always? Or just in calendar? Put it in header for easy access */}
             <ActionIcon variant="filled" color="green" size="lg" radius="md" onClick={() => handleOpenAddEntry()}>
                <IconPlus size={24} stroke={2.5} />
             </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Title order={5} mb="md">Menu</Title>
        <Button variant="light" color="red" onClick={logout} fullWidth>
          Esci
        </Button>
      </AppShell.Navbar>

      <AppShell.Main pb={80}> {/* Padding bottom for mobile tabs if we had a bottom bar, but we use top tabs or simple switch */}
        <Container size="md" mt="md">
            <Tabs value={activeTab} onChange={setActiveTab} variant="default" radius="md" defaultValue="timer" keepMounted={false}>
                <Tabs.List grow mb={50} style={{ borderBottom: 'none' }}>
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
                    
                    {/* Show today's stats below timer? */}
                </Tabs.Panel>

                <Tabs.Panel value="calendar">
                    <CalendarView entries={entries} onAddEntry={handleOpenAddEntry} />
                </Tabs.Panel>
            </Tabs>
        </Container>
      </AppShell.Main>

      <ManualEntryModal 
        opened={manualModalOpen} 
        onClose={() => setManualModalOpen(false)} 
        initialDate={entryDate}
        onEntrySaved={() => {
            // Refresh logic handled by subscription
        }} 
      />
    </AppShell>
  );
}
