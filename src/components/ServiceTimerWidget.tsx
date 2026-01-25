import { useState, useEffect, useRef } from 'react';
import { Button, Card, Text, Group, ActionIcon, Modal, Stack, Textarea, ThemeIcon, Divider, Badge } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconChecks, IconUserPlus, IconUser, IconClock } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { addServiceEntry } from '../services/firestore';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import { formatTime } from '../utils/formatUtils';
import type { Contact } from '../types';
import AddContactModal from './AddContactModal';

interface ServiceTimerWidgetProps {
    onEntrySaved?: () => void;
}

const STORAGE_KEY = 'service_timer_state';

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

    // Helper to save state
    const saveState = (newState: Partial<TimerState>) => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const currentState = stored ? JSON.parse(stored) : {};
        const merged: TimerState = {
            status,
            startTime: startTimeRef.current,
            accumulatedTime,
            notes,
            tempContacts,
            ...currentState, // keep existing fields
            ...newState      // overwrite with new
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    };

    // Load state on mount
    useEffect(() => {
        const savedRaw = localStorage.getItem(STORAGE_KEY);
        if (savedRaw) {
            try {
                const saved: TimerState = JSON.parse(savedRaw);
                setStatus(saved.status);
                setAccumulatedTime(saved.accumulatedTime);
                startTimeRef.current = saved.startTime;
                
                // Restore data
                setNotes(saved.notes || '');
                setTempContacts(saved.tempContacts || []);

                if (saved.status === 'running' && saved.startTime) {
                    // Calculate elapsed time including the time app was closed
                    // elapsed = accumulated + (now - restartTime)
                    const currentSession = Math.floor((Date.now() - saved.startTime) / 1000);
                    setElapsed(saved.accumulatedTime + currentSession);
                } else {
                    setElapsed(saved.accumulatedTime);
                }
            } catch (e) {
                console.error("Failed to restore timer state", e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Timer Interval
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
        saveState({ status: 'running', startTime: now });
    };

    const handlePause = () => {
        setStatus('paused');
        setAccumulatedTime(elapsed);
        startTimeRef.current = null;
        saveState({ status: 'paused', accumulatedTime: elapsed, startTime: null });
    };

    const handleResume = () => {
        const now = Date.now();
        setStatus('running');
        startTimeRef.current = now;
        saveState({ status: 'running', startTime: now });
    };

    const handleStop = () => {
        setStatus('idle');
        setFinalTime(elapsed);
        setIsModalOpen(true);
        
        // Clear running state logic but keep data for modal
        setElapsed(0);
        setAccumulatedTime(0);
        startTimeRef.current = null;
        // Don't clear storage yet, wait for save/discard
    };

    const cleanUp = () => {
        setElapsed(0);
        setAccumulatedTime(0);
        startTimeRef.current = null;
        setNotes('');
        setTempContacts([]);
        setIsModalOpen(false);
        setStatus('idle');
        localStorage.removeItem(STORAGE_KEY);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const now = new Date();
            // Start time approximation
            const start = new Date(now.getTime() - finalTime * 1000);
            
            await addServiceEntry({
                userId: user.uid,
                date: dayjs(start).format('YYYY-MM-DD'),
                startTime: Timestamp.fromDate(start),
                endTime: Timestamp.fromDate(now),
                duration: finalTime,
                type: 'timer',
                notes: notes.trim(),
                contacts: tempContacts
            });
            
            if (onEntrySaved) onEntrySaved();
            cleanUp();
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Errore nel salvataggio.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddTempContact = (contact: Contact) => {
        const newContacts = [...tempContacts, contact];
        setTempContacts(newContacts);
        saveState({ tempContacts: newContacts });
    };

    const handleNotesChange = (val: string) => {
        setNotes(val);
        saveState({ notes: val });
    };

    return (
        <>
            <Card shadow="sm" radius="md" p="md" withBorder>
                <Group justify="space-between" align="center">
                    
                    {/* Left Side: Label or Status */}
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

                    {/* Right Side: Controls */}
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

            {/* Save Modal */}
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
