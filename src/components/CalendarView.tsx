import { useState } from 'react';
import { Card, Text, Stack, SegmentedControl, Group, ActionIcon, Button, Modal } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import type { ServiceEntry } from '../types';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

import CalendarMonthView from './calendar/CalendarMonthView';
import CalendarWeekView from './calendar/CalendarWeekView';
import CalendarDayView from './calendar/CalendarDayView';
import EditEntryModal from './EditEntryModal';
import { deleteServiceEntry, updateServiceEntry } from '../services/firestore';

// Set locale globally
dayjs.locale('it');

type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarViewProps {
  entries: ServiceEntry[];
  onAddEntry: (date: Date) => void;
}

export default function CalendarView({ entries, onAddEntry }: CalendarViewProps) {
  const [view, setView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Edit logic
  const [editingEntry, setEditingEntry] = useState<ServiceEntry | null>(null);
  const [isEditModalOpen, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  
  // Delete logic
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const handleSelectDate = (date: Date) => {
      setCurrentDate(date);
      if (view === 'month') {
          setView('day');
      }
  }
  
  const handleEdit = (entry: ServiceEntry) => {
      setEditingEntry(entry);
      openEditModal();
  };

  const handleSaveEdit = async (id: string, updates: Partial<ServiceEntry>) => {
      await updateServiceEntry(id, updates);
      // No need to manually update state, firestore subscription will do it
  };

  const handleDeleteClick = (id: string) => {
      setDeletingId(id);
      openDeleteModal();
  };

  const confirmDelete = async () => {
      if (deletingId) {
          await deleteServiceEntry(deletingId);
          closeDeleteModal();
          setDeletingId(null);
      }
  };
  
  const handleNext = () => {
      const unit = view === 'week' ? 'week' : view === 'day' ? 'day' : 'month';
      setCurrentDate(dayjs(currentDate).add(1, unit).toDate());
  };
  
  const handlePrev = () => {
      const unit = view === 'week' ? 'week' : view === 'day' ? 'day' : 'month';
      setCurrentDate(dayjs(currentDate).subtract(1, unit).toDate());
  }
  
  const handleToday = () => {
      setCurrentDate(new Date());
  }

  const getViewLabel = () => {
      if (view === 'month') return dayjs(currentDate).format('MMMM YYYY');
      if (view === 'day') return dayjs(currentDate).format('D MMMM YYYY');
      if (view === 'week') {
          const start = dayjs(currentDate).startOf('week');
          const end = dayjs(currentDate).endOf('week');
          if (start.month() === end.month()) {
              return `${start.format('D')} - ${end.format('D MMMM YYYY')}`;
          }
          return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`;
      }
      return '';
  }

  return (
    <>
      <Stack gap="md">
        <Card withBorder radius="md" p="sm">
          <Stack gap="sm">
              {/* Header with Navigation and View Switcher */}
              <Group justify="space-between" align="center" wrap="wrap-reverse"> 
                  <Group gap="xs">
                      <Button variant="default" size="xs" onClick={handleToday}>Oggi</Button>
                      <Group gap={4}>
                          <ActionIcon variant="subtle" color="gray" onClick={handlePrev}>
                              <IconChevronLeft size={18} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="gray" onClick={handleNext}>
                              <IconChevronRight size={18} />
                          </ActionIcon>
                      </Group>
                      <Text fw={700} size="lg" tt="capitalize" style={{ minWidth: 150 }}>
                          {getViewLabel()}
                      </Text>
                  </Group>

                  <SegmentedControl 
                      value={view}
                      onChange={(val) => setView(val as CalendarViewType)}
                      data={[
                          { label: 'Mese', value: 'month' },
                          { label: 'Settimana', value: 'week' },
                          { label: 'Giorno', value: 'day' }
                      ]}
                  />
              </Group>

              {/* View Content */}
              {view === 'month' && (
                  <CalendarMonthView 
                      currentDate={currentDate} 
                      onSelectDate={handleSelectDate} 
                      entries={entries} 
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onAddEntry={onAddEntry}
                  />
              )}
              
              {view === 'week' && (
                  <CalendarWeekView 
                      currentDate={currentDate} 
                      entries={entries}
                      onSelectDate={(date) => {
                          setCurrentDate(date);
                          setView('day');
                      }}
                  />
              )}
              
              {view === 'day' && (
                  <CalendarDayView 
                      currentDate={currentDate} 
                      entries={entries} 
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                  />
              )}
          </Stack>
        </Card>
      </Stack>

      {/* Edit Modal */}
      <EditEntryModal 
          opened={isEditModalOpen} 
          onClose={closeEditModal} 
          entry={editingEntry} 
          onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      <Modal opened={isDeleteModalOpen} onClose={closeDeleteModal} title="Elimina Attività" centered>
          <Text size="sm">Sei sicuro di voler eliminare questa attività? Questa azione non può essere annullata.</Text>
          <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeDeleteModal}>Annulla</Button>
              <Button color="red" onClick={confirmDelete}>Elimina</Button>
          </Group>
      </Modal>
    </>
  );
}
