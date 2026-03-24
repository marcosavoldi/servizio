import { Modal, Textarea, Button, Group, Stack, MultiSelect } from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { subscribeToUserSettings } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import type { ServiceEntry } from '../types';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';

interface EditEntryModalProps {
  opened: boolean;
  onClose: () => void;
  entry: ServiceEntry | null;
  onSave: (id: string, updates: Partial<ServiceEntry>) => Promise<void>;
}

export default function EditEntryModal({ opened, onClose, entry, onSave }: EditEntryModalProps) {
  const form = useForm({
    initialValues: {
      date: new Date(),
      startTime: '',
      endTime: '',
      notes: '',
      deliveredPublications: [] as string[],
    },
    validate: {
        startTime: (value: string) => (value ? null : 'Ora inizio richiesta'),
        endTime: (value: string) => (value ? null : 'Ora fine richiesta'),
    }
  });

  useEffect(() => {
    if (entry) {
        form.setValues({
            date: dayjs(entry.date).toDate(),
            startTime: dayjs(entry.startTime.toDate()).format('HH:mm'),
            endTime: dayjs(entry.endTime.toDate()).format('HH:mm'),
            notes: entry.notes || '',
            deliveredPublications: entry.deliveredPublications || [],
        });
    }
  }, [entry]);

  const { user } = useAuth();
  const [catalog, setCatalog] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserSettings(user.uid, (settings) => {
        setCatalog(settings.publicationCatalog || []);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!entry || !entry.id) return;

    // Calculate timestamps
    const dateStr = dayjs(values.date).format('YYYY-MM-DD');
    const startDateTime = dayjs(`${dateStr} ${values.startTime}`, 'YYYY-MM-DD HH:mm');
    const endDateTime = dayjs(`${dateStr} ${values.endTime}`, 'YYYY-MM-DD HH:mm');

    const duration = endDateTime.diff(startDateTime, 'second');

    if (duration < 0) {
        form.setFieldError('endTime', 'L\'ora di fine deve essere dopo l\'inizio');
        return;
    }

    try {
        await onSave(entry.id, {
            date: dateStr,
            startTime: Timestamp.fromDate(startDateTime.toDate()),
            endTime: Timestamp.fromDate(endDateTime.toDate()),
            duration: duration,
            notes: values.notes,
            deliveredPublications: values.deliveredPublications
        });
        onClose();
    } catch (error) {
        console.error("Failed to update entry", error);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Modifica Attività" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <DateInput
            label="Data"
            placeholder="Seleziona data"
            {...form.getInputProps('date')}
            required
            valueFormat="DD MMMM YYYY"
          />
          
          <Group grow>
            <TimeInput
              label="Inizio"
              {...form.getInputProps('startTime')}
              required
            />
            <TimeInput
              label="Fine"
              {...form.getInputProps('endTime')}
              required
            />
          </Group>

          <Textarea
            label="Note"
            placeholder="Dettagli attività..."
            {...form.getInputProps('notes')}
            minRows={3}
          />
          
          <MultiSelect
             label="Pubblicazioni consegnate"
             placeholder="Seleziona..."
             data={catalog}
             searchable
             clearable
             maxDropdownHeight={150}
             comboboxProps={{ withinPortal: true }}
             {...form.getInputProps('deliveredPublications')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Annulla</Button>
            <Button type="submit" color="teal">Salva Modifiche</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
