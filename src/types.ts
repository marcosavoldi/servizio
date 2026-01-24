import { Timestamp } from 'firebase/firestore';

export interface ServiceEntry {
    id?: string;
    userId: string;
    date: string; // YYYY-MM-DD
    startTime: Timestamp; // Full timestamp for calculations
    endTime: Timestamp;
    duration: number; // in seconds
    type: 'timer' | 'manual';
    notes?: string;
    createdAt: Timestamp;
}
