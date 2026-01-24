import { useState, useEffect, useRef } from 'react';
import { Button, Card, Text, Center, Stack, Modal, Textarea, Group, RingProgress, ThemeIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlayerPlay, IconPlayerStop, IconChecks } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { addServiceEntry } from '../services/firestore';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';

import { formatTime } from '../utils/formatUtils';

interface ServiceTimerProps {
  onEntrySaved: () => void;
}

export default function ServiceTimer({ onEntrySaved }: ServiceTimerProps) {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 50em)');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
  };

  const handleStop = () => {
    setIsRunning(false);
    setFinalTime(elapsed);
    setIsModalOpen(true);
  };

  const cleanUp = () => {
      setElapsed(0);
      startTimeRef.current = null;
      setNotes('');
      setIsModalOpen(false);
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const now = new Date();
      // Start time was approximately now - duration
      const start = new Date(now.getTime() - finalTime * 1000);
      
      await addServiceEntry({
        userId: user.uid,
        date: dayjs(start).format('YYYY-MM-DD'),
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(now),
        duration: finalTime,
        type: 'timer',
        notes: notes.trim(),
      });
      
      onEntrySaved();
      cleanUp();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Errore nel salvataggio. Controlla la tua connessione o i permessi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
      if(confirm("Sei sicuro di voler scartare questo tempo?")) {
        cleanUp();
      }
  }

  return (
    <>
      <Card shadow="md" padding="xl" radius="lg" withBorder style={{ overflow: 'visible' }}>
        <Stack align="center" gap="xl">
          <Center>
            <RingProgress
              size={240}
              thickness={16}
              roundCaps
              sections={[{ value: isRunning ? 100 : 0, color: isRunning ? 'teal' : 'gray.2' }]} 
              label={
                <Stack gap={0} align="center">
                   <Text c="dimmed" size="xs" tt="uppercase" fw={700} style={{ letterSpacing: 1 }}>
                    Tempo
                  </Text>
                  <Text fw={800} fz={54} style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {formatTime(elapsed)}
                  </Text>
                  <Text c={isRunning ? 'teal' : 'dimmed'} size="sm" fw={500} mt={4}>
                      {isRunning ? 'In corso...' : 'Pronto'}
                  </Text>
                </Stack>
              }
            />
          </Center>
          
          {!isRunning ? (
             <Button 
                size="xl" 
                radius="xl" 
                color="teal"
                leftSection={<IconPlayerPlay size={28}/>}
                onClick={handleStart}
                fullWidth
                style={{ 
                    transition: 'transform 0.2s',
                    boxShadow: '0 4px 14px 0 rgba(0, 150, 136, 0.39)'
                }}
            >
              Inizia servizio
            </Button>
          ) : (
             <Button 
              size="xl" 
              radius="xl" 
              color="red"
              variant="light"
              leftSection={<IconPlayerStop size={28}/>}
              onClick={handleStop}
              fullWidth
            >
              Termina sessione
            </Button>
          )}
        </Stack>
      </Card>

      <Modal 
        opened={isModalOpen} 
        onClose={() => {}} 
        title={<Text size="lg" fw={700}>Salva Sessione</Text>} 
        centered 
        fullScreen={isMobile}
        padding="lg"
        radius="md"
        size="md"
        withCloseButton={false} 
        closeOnClickOutside={false}
        transitionProps={{ transition: 'fade', duration: 200 }}
      >
        <Stack>
          <Center mt={isMobile ? 'xl' : 0}>
            <ThemeIcon size={80} radius="xl" color="teal" variant="light">
                <IconChecks size={48} />
            </ThemeIcon>
          </Center>
          <Text ta="center" size="xl" fw={700} mt="md">
            Ottimo lavoro!
          </Text>
          <Text ta="center" c="dimmed" size="lg">
            Hai completato <b>{formatTime(finalTime)}</b> di servizio.
          </Text>
          
          <Textarea
             label="Note"
             placeholder="Aggiungi una nota..."
             value={notes}
             onChange={(e) => setNotes(e.currentTarget.value)}
             minRows={4}
             mt="md"
          />
          <Group grow mt="xl">
              <Button variant="subtle" color="gray" size="md" onClick={handleDiscard} disabled={saving}>Scarta</Button>
              <Button onClick={handleSave} loading={saving} color="teal" size="md">Salva servizio</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
