import { useState, useEffect } from 'react';
import { Modal, Button, Textarea, Group, Stack } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { useAuth } from '../context/AuthContext';
import { addServiceEntry } from '../services/firestore';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import { IconClock } from '@tabler/icons-react';
import CustomModalHeader from './common/CustomModalHeader';

interface ManualEntryModalProps {
  opened: boolean;
  onClose: () => void;
  onEntrySaved: () => void;
  initialDate?: Date | null;
}

export default function ManualEntryModal({ opened, onClose, onEntrySaved, initialDate }: ManualEntryModalProps) {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 50em)');
  const [date, setDate] = useState<Date | null>(new Date());
  
  useEffect(() => {
    if (opened && initialDate) {
        setDate(initialDate);
    } else if (opened && !initialDate) {
        setDate(new Date());
    }
  }, [opened, initialDate]);

  // Default: start now, end 1 hour later
  const [startTime, setStartTime] = useState<string>(dayjs().format('HH:mm'));
  const [endTime, setEndTime] = useState<string>(dayjs().add(1, 'hour').format('HH:mm'));
  
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !date || !startTime || !endTime) return;
    setSaving(true);
    
    try {
        // Construct full Date objects
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        
        const start = dayjs(date).hour(sh).minute(sm).second(0).toDate();
        const end = dayjs(date).hour(eh).minute(em).second(0).toDate();
        
        let duration = (end.getTime() - start.getTime()) / 1000;
        if (duration < 0) {
            // Assume next day if end time is before start time (night shift?) 
            // - Simplified: just alert user for now to check dates
            alert("L'orario di fine deve essere dopo l'inizio.");
            setSaving(false);
            return;
        }

      await addServiceEntry({
        userId: user.uid,
        date: dayjs(date).format('YYYY-MM-DD'),
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        duration: duration,
        type: 'manual',
        notes: notes.trim(),
      });
      
      onEntrySaved();
      onClose();
      // Reset form defaults?
      setNotes('');
    } catch (error) {
      console.error("Error saving manual entry:", error);
      alert("Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      withCloseButton={false}
      title={null}
      centered
      fullScreen={isMobile}
      padding={0}
    >
      <Stack gap="md" h="100%">
        {/* Custom Header */}
        <CustomModalHeader 
            title="Aggiungi uscita manuale" 
            onClose={onClose} 
        />
        
        <Stack gap="md" p="lg" pt={0}>
            <DatePickerInput
                label="Data"
                value={date}
                onChange={(val) => setDate(val as Date | null)}
                clearable={false}
                pointer
            />
            <Group grow>
                <TimeInput 
                    label="Inizio" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.currentTarget.value)} 
                    leftSection={<IconClock size={16} />}
                />
                <TimeInput 
                    label="Fine" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.currentTarget.value)} 
                    leftSection={<IconClock size={16} />}
                />
            </Group>
             <Textarea
                 label="Note"
                 placeholder="Dettagli..."
                 value={notes}
                 onChange={(e) => setNotes(e.currentTarget.value)}
              />
            <Group justify="flex-end" mt="md">
                <Button variant="subtle" color="gray" onClick={onClose} disabled={saving}>Annulla</Button>
                <Button onClick={handleSave} loading={saving} color="teal">Salva</Button>
            </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}
