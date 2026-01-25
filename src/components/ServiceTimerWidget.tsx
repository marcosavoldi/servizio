import { useState, useEffect, useRef } from 'react';
import { Button, Card, Text, Group, ActionIcon, Modal, Stack, Textarea, ThemeIcon, Divider, Badge } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconChecks, IconUserPlus, IconUser, IconClock } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { addServiceEntry, saveTimerSession, deleteTimerSession, subscribeToActiveTimer, addGlobalContact } from '../services/firestore';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import { formatTime } from '../utils/formatUtils';
import type { Contact } from '../types';
import AddContactModal from './AddContactModal';

interface ServiceTimerWidgetProps {
    onEntrySaved?: () => void;
}

interface TimerState {
    status: 'idle' | 'running' | 'paused';
    startTime: number | null;
    accumulatedTime: number;
    notes: string;
    tempContacts: Contact[];
}

export default function ServiceTimerWidget({ onEntrySaved }: ServiceTimerWidgetProps) {
    const { user } = useAuth();
    
    // Timer State
    const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
    const [elapsed, setElapsed] = useState(0);
    const [accumulatedTime, setAccumulatedTime] = useState(0);
    const startTimeRef = useRef<number | null>(null);

    // Save Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [finalTime, setFinalTime] = useState(0);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [tempContacts, setTempContacts] = useState<Contact[]>([]);
    const [contactModalOpen, setContactModalOpen] = useState(false);

    // Cloud Sync: Subscribe to active timer
    useEffect(() => {
        if (!user) return;
        
        const unsubscribe = subscribeToActiveTimer(user.uid, (remoteState) => {
            if (remoteState) {
                // We found an active session in the cloud!
                const saved = remoteState as TimerState;
                
                setStatus(saved.status);
                setAccumulatedTime(saved.accumulatedTime);
                startTimeRef.current = saved.startTime;
                
                // Only update notes if we are not currently editing (basic protection)
                // Actually, for simplicity, we assume single-user-single-device active usage. 
                // We overwrite local state to keep in sync.
                if (saved.notes) setNotes(saved.notes);
                if (saved.tempContacts) setTempContacts(saved.tempContacts);

                if (saved.status === 'running' && saved.startTime) {
                    const currentSession = Math.floor((Date.now() - saved.startTime) / 1000);
                    setElapsed(saved.accumulatedTime + currentSession);
                } else {
                    setElapsed(saved.accumulatedTime);
                }
            } else {
                // No remote state. If we are 'idle', that's fine. 
                // If we thought we were running, maybe another device stopped it? 
                // We'll reset to idle if we were not in the middle of saving.
                if (!isModalOpen) {
                    setStatus('idle');
                    setElapsed(0);
                }
            }
        });

        return () => unsubscribe();
    }, [user, isModalOpen]);

    const syncToCloud = (newState: Partial<TimerState>) => {
        if (!user) return;
        
        // Construct current full state to save
        const currentRefState: TimerState = {
            status,
            startTime: startTimeRef.current,
            accumulatedTime,
            notes,
            tempContacts,
            ...newState
        };
        saveTimerSession(user.uid, currentRefState);
    };

    // Timer Interval for UI ticking
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (status === 'running') {
            interval = setInterval(() => {
                if (startTimeRef.current) {
                    const currentSession = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    setElapsed(accumulatedTime + currentSession);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, accumulatedTime]);

    const handleStart = () => {
        const now = Date.now();
        setStatus('running');
        startTimeRef.current = now;
        syncToCloud({ status: 'running', startTime: now });
    };

    const handlePause = () => {
        setStatus('paused');
        setAccumulatedTime(elapsed);
        startTimeRef.current = null;
        syncToCloud({ status: 'paused', accumulatedTime: elapsed, startTime: null });
    };

    const handleResume = () => {
        const now = Date.now();
        setStatus('running');
        startTimeRef.current = now;
        syncToCloud({ status: 'running', startTime: now });
    };

    const handleStop = () => {
        setStatus('idle');
        setFinalTime(elapsed);
        setIsModalOpen(true);
        
        setElapsed(0);
        setAccumulatedTime(0);
        startTimeRef.current = null;
        // NOTE: We do NOT delete from cloud yet. We wait for Save or Discard.
        // This protects the session if app crashes during save modal.
        syncToCloud({ status: 'idle', accumulatedTime: elapsed, startTime: null });
    };

    const cleanUp = () => {
        setElapsed(0);
        setAccumulatedTime(0);
        startTimeRef.current = null;
        setNotes('');
        setTempContacts([]);
        setIsModalOpen(false);
        setStatus('idle');
        if (user) deleteTimerSession(user.uid);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const now = new Date();
            // Start time approximation
            const start = new Date(now.getTime() - finalTime * 1000);
            
            // Optimistic Save
            const saveOp = addServiceEntry({
                userId: user.uid,
                date: dayjs(start).format('YYYY-MM-DD'),
                startTime: Timestamp.fromDate(start),
                endTime: Timestamp.fromDate(now),
                duration: finalTime,
                type: 'timer',
                notes: notes.trim(),
                contacts: tempContacts
            });

            const timeoutOp = new Promise(resolve => setTimeout(resolve, 2000));
            
            await Promise.race([saveOp, timeoutOp]);
            
            if (onEntrySaved) onEntrySaved();
            cleanUp();
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Errore nel salvataggio o connessione assente.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddTempContact = async (contact: Contact) => {
        if (!user) return;
        
        try {
            // Strip the temporary local UUID
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...contactData } = contact;
            
            const docRef = await addGlobalContact(user.uid, contactData);
            const newContact = { ...contact, id: docRef.id };
            
            const newContacts = [...tempContacts, newContact];
            setTempContacts(newContacts);
            syncToCloud({ tempContacts: newContacts });
        } catch (error) {
            console.error("Error adding global contact:", error);
            alert("Errore durante il salvataggio del contatto.");
        }
    };

    const handleNotesChange = (val: string) => {
        setNotes(val);
        // We sync on blur or we could debounce here. 
        // For now, let's sync only on explicit actions or rely on blur? 
        // Let's debounce sync inside the handler for better UX? 
        // Actually simplest is just set local state. 
        // We add a separate onBlur handler for the textarea to sync.
    };
    
    const handleNotesBlur = () => {
        syncToCloud({ notes });
    }

    return (
        <>
            <Card shadow="sm" radius="md" p="md" withBorder>
                <Group justify="space-between" align="center">
                    
                    <Group gap="sm">
                        {status === 'idle' ? (
                            <ThemeIcon variant="light" color="gray" size="lg" radius="md">
                                <IconClock size={20} />
                            </ThemeIcon>
                        ) : (
                             <ThemeIcon variant="light" color={status === 'paused' ? 'yellow' : 'teal'} size="lg" radius="md">
                                <IconClock size={20} />
                            </ThemeIcon>
                        )}
                        
                        <Stack gap={0}>
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Tempo Servizio</Text>
                            {status === 'idle' ? (
                                <Text size="sm" fw={500}>Pronto ad iniziare</Text>
                            ) : (
                                <Group gap={6} align="center">
                                     <Text size="xl" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {formatTime(elapsed)}
                                     </Text>
                                     {status === 'paused' && <Badge size="xs" color="yellow" variant="light">PAUSA</Badge>}
                                </Group>
                            )}
                        </Stack>
                    </Group>

                    <Group gap="xs">
                        {status === 'idle' ? (
                            <ActionIcon 
                                variant="filled" 
                                color="teal" 
                                size="xl" 
                                radius="md" 
                                onClick={handleStart}
                                title="Avvia Servizio"
                            >
                                <IconPlayerPlay size={24} fill="currentColor" />
                            </ActionIcon>
                        ) : (
                            <>
                                {status === 'running' ? (
                                    <ActionIcon 
                                        variant="light" 
                                        color="yellow" 
                                        size="xl" 
                                        radius="md" 
                                        onClick={handlePause}
                                        title="Pausa"
                                    >
                                        <IconPlayerPause size={24} fill="currentColor" />
                                    </ActionIcon>
                                ) : (
                                     <ActionIcon 
                                        variant="light" 
                                        color="teal" 
                                        size="xl" 
                                        radius="md" 
                                        onClick={handleResume}
                                        title="Riprendi"
                                    >
                                        <IconPlayerPlay size={24} fill="currentColor" />
                                    </ActionIcon>
                                )}

                                <ActionIcon 
                                    variant="light" 
                                    color="red" 
                                    size="xl" 
                                    radius="md" 
                                    onClick={handleStop}
                                    title="Termina e Salva"
                                >
                                    <IconPlayerStop size={24} fill="currentColor" />
                                </ActionIcon>
                            </>
                        )}
                    </Group>
                </Group>
            </Card>

            <Modal 
                opened={isModalOpen} 
                onClose={() => {}} 
                centered 
                padding="xl"
                radius="lg"
                withCloseButton={false}
                closeOnClickOutside={false}
            >
                <Stack align="center" gap="md">
                    <ThemeIcon size={60} radius="xl" color="teal" variant="light">
                        <IconChecks size={32} />
                    </ThemeIcon>
                    
                    <Stack gap={0} align="center">
                         <Text size="lg" fw={700}>Sessione Terminata</Text>
                         <Text c="dimmed">Hai effettuato <b>{formatTime(finalTime)}</b> di servizio.</Text>
                    </Stack>
                    
                    <Textarea
                        placeholder="Note opzionali..."
                        value={notes}
                        onChange={(e) => handleNotesChange(e.currentTarget.value)}
                        onBlur={handleNotesBlur}
                        minRows={3}
                        w="100%"
                    />

                    {tempContacts.length > 0 && (
                         <Stack gap="xs" w="100%">
                            <Divider label="Contatti aggiunti" labelPosition="center" />
                            {tempContacts.map((c, idx) => (
                                <Group key={idx} gap="xs" justify="center">
                                    <IconUser size={14} color="gray" />
                                    <Text size="sm">{c.firstName} {c.lastName}</Text>
                                </Group>
                            ))}
                         </Stack>
                    )}

                    <Button 
                        variant="subtle" 
                        size="xs" 
                        leftSection={<IconUserPlus size={14} />}
                        onClick={() => setContactModalOpen(true)}
                    >
                        Aggiungi Contatto
                    </Button>

                    <Group w="100%" grow pt="sm">
                        <Button variant="subtle" color="red" onClick={cleanUp} disabled={saving}>Scarta</Button>
                        <Button color="teal" onClick={handleSave} loading={saving}>Salva</Button>
                    </Group>
                </Stack>
            </Modal>

            <AddContactModal 
                opened={contactModalOpen} 
                onClose={() => setContactModalOpen(false)} 
                onSave={handleAddTempContact} 
            />
        </>
    );
}
