import { Modal, Stack } from '@mantine/core';
import { v4 as uuidv4 } from 'uuid';
import type { Contact } from '../types';
import CustomModalHeader from './common/CustomModalHeader';
import ContactForm from './ContactForm';
import type { ContactFormValues } from './ContactForm';

interface AddContactModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

export default function AddContactModal({ opened, onClose, onSave }: AddContactModalProps) {
  
  const handleSave = (values: ContactFormValues) => {
    const newContact: Contact = {
        id: uuidv4(),
        ...values
    };
    onSave(newContact);
    onClose();
  };

  return (
    <Modal 
        opened={opened} 
        onClose={onClose} 
        withCloseButton={false} 
        padding={0}
        size="md"
        centered
    >
      <Stack gap="sm">
          <CustomModalHeader title="Nuovo Contatto" onClose={onClose} />
          <ContactForm onSave={handleSave} onCancel={onClose} submitLabel="Salva Contatto" />
      </Stack>
    </Modal>
  );
}
