import { TextInput, Group, Button, Stack, MultiSelect, ScrollArea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserSettings } from '../services/firestore';

export interface ContactFormValues {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
    mobile: string;
    email: string;
    // notes removed
    deliveredPublications: string[];
}

interface ContactFormProps {
    initialValues?: Partial<ContactFormValues>;
    onSave: (values: ContactFormValues) => void;
    onCancel: () => void;
    submitLabel?: string;
}

export default function ContactForm({ initialValues, onSave, onCancel, submitLabel = "Salva" }: ContactFormProps) {
    const { user } = useAuth();
    const [catalog, setCatalog] = useState<string[]>([]);
    const [customPublication, setCustomPublication] = useState('');

    useEffect(() => {
        if (!user) return;
        return subscribeToUserSettings(user.uid, (settings) => {
            setCatalog(settings.publicationCatalog);
        });
    }, [user]);

    const form = useForm({
        initialValues: {
            firstName: initialValues?.firstName || '',
            lastName: initialValues?.lastName || '',
            address: initialValues?.address || '',
            phone: initialValues?.phone || '',
            mobile: initialValues?.mobile || '',
            email: initialValues?.email || '',
            deliveredPublications: initialValues?.deliveredPublications || []
        },
        validate: {
            firstName: (value) => (value.trim().length > 0 ? null : 'Il nome è obbligatorio'),
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        // Process publications: remove "Altro" and add custom value if present
        let finalPublications = values.deliveredPublications.filter(p => p !== 'Altro');
        
        if (values.deliveredPublications.includes('Altro') && customPublication.trim()) {
            finalPublications.push(customPublication.trim());
        }

        onSave({ ...values, deliveredPublications: finalPublications });
        form.reset();
        setCustomPublication('');
    };

    const showCustomInput = form.values.deliveredPublications.includes('Altro');

    return (
        <ScrollArea.Autosize mah="60vh" type="auto" offsetScrollbars>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack p="md" gap="sm">
                    <Group grow>
                        <TextInput label="Nome" required placeholder="Mario" {...form.getInputProps('firstName')} />
                        <TextInput label="Cognome" placeholder="Rossi" {...form.getInputProps('lastName')} />
                    </Group>
                    
                    <TextInput label="Indirizzo" placeholder="Via Roma 1, Milano" {...form.getInputProps('address')} />
                    
                    <Group grow>
                        <TextInput label="Cellulare" placeholder="+39 333..." {...form.getInputProps('mobile')} />
                        <TextInput label="Telefono" placeholder="02..." {...form.getInputProps('phone')} />
                    </Group>

                    <TextInput label="Email" placeholder="mario.rossi@email.com" {...form.getInputProps('email')} />
                    
                    <MultiSelect 
                        label="Pubblicazioni consegnate" 
                        placeholder="Seleziona..." 
                        data={[...catalog, 'Altro']}
                        searchable
                        clearable
                        maxDropdownHeight={150}
                        comboboxProps={{ withinPortal: true }}
                        {...form.getInputProps('deliveredPublications')}
                    />

                    {showCustomInput && (
                        <TextInput 
                            placeholder="Specifica altra pubblicazione..." 
                            value={customPublication}
                            onChange={(e) => setCustomPublication(e.currentTarget.value)}
                            required
                        />
                    )}

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={onCancel}>Annulla</Button>
                        <Button type="submit" color="teal">{submitLabel}</Button>
                    </Group>
                </Stack>
            </form>
        </ScrollArea.Autosize>
    );
}
