import { Timestamp } from 'firebase/firestore';

export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    address?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    // Legacy: to be migrated to notes
    publications?: string;
    // New fields
    notes?: string | ContactNote[];
    deliveredPublications?: string[];

    // Global Address Book Metadata
    createdAt?: string;
    updatedAt?: string;
}

export interface ContactNote {
    id: string;
    content: string;
    createdAt: string;
}

export interface ServiceEntry {
    id?: string;
    userId: string;
    date: string; // YYYY-MM-DD
    startTime: Timestamp; // Full timestamp for calculations
    endTime: Timestamp;
    duration: number; // in seconds
    type: 'timer' | 'manual';
    notes?: string;
    contacts?: Contact[];
    createdAt: Timestamp;
}

export interface UserSettings {
    publicationCatalog?: string[];
    monthlyGoals?: Record<string, number>; // key: "YYYY-MM", value: hours
}
