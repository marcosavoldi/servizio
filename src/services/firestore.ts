import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    deleteDoc,
    doc,
    updateDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ServiceEntry } from '../types';

const ENTRIES_COLLECTION = 'entries';

export const addServiceEntry = async (entry: Omit<ServiceEntry, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, ENTRIES_COLLECTION), {
        ...entry,
        createdAt: Timestamp.now(),
    });
};

export const deleteServiceEntry = async (id: string) => {
    return deleteDoc(doc(db, ENTRIES_COLLECTION, id));
};

export const updateServiceEntry = async (id: string, data: Partial<Omit<ServiceEntry, 'id' | 'createdAt'>>) => {
    return updateDoc(doc(db, ENTRIES_COLLECTION, id), data);
};

export const subscribeToMonthEntries = (
    userId: string,
    _monthStart: Date,
    _monthEnd: Date,
    callback: (entries: ServiceEntry[]) => void
) => {
    // Convert JS Dates to YYYY-MM-DD string range for simple filtering or use Timestamp if date field was Timestamp.
    // We used date as string YYYY-MM-DD in type def for easy grouping, but for range queries timestamp is better.
    // Let's rely on client side filtering for specific month view or query by date string if we index it.
    // For simplicity and small data scale per user, getting all or last X months is fine.
    // Let's query by userId and order by date.

    const q = query(
        collection(db, ENTRIES_COLLECTION),
        where('userId', '==', userId),
        orderBy('date', 'desc'), // Most recent first
        orderBy('startTime', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ServiceEntry[];
        callback(entries);
    });
};

// User Settings
const USERS_COLLECTION = 'users';



export const subscribeToUserSettings = (userId: string, callback: (settings: { publicationCatalog: string[], monthlyGoals: Record<string, number> }) => void) => {
    return onSnapshot(doc(db, USERS_COLLECTION, userId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            callback({
                publicationCatalog: data.publicationCatalog || [],
                monthlyGoals: data.monthlyGoals || {}
            });
        } else {
            callback({ publicationCatalog: [], monthlyGoals: {} });
        }
    });
}

export const updatePublicationCatalog = async (userId: string, catalog: string[]) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const { setDoc } = await import('firebase/firestore');
    return setDoc(userRef, { publicationCatalog: catalog }, { merge: true });
}

export const updateMonthlyGoal = async (userId: string, month: string, hours: number) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const { updateDoc, setDoc } = await import('firebase/firestore');

    try {
        // Try to update specifically this key using dot notation to avoid overwriting the map
        await updateDoc(userRef, {
            [`monthlyGoals.${month}`]: hours
        });
    } catch (e: any) {
        // If document doesn't exist, create it
        if (e.code === 'not-found') {
            await setDoc(userRef, {
                monthlyGoals: {
                    [month]: hours
                }
            }, { merge: true });
        } else {
            throw e;
        }
    }
}

// Timer Persistence
export const saveTimerSession = async (userId: string, state: any) => {
    // We store the session in a specific doc: users/{userId}/timer/active
    const timerRef = doc(db, USERS_COLLECTION, userId, 'timer', 'active');
    const { setDoc } = await import('firebase/firestore');
    return setDoc(timerRef, { ...state, updatedAt: Timestamp.now() }, { merge: true });
};

export const deleteTimerSession = async (userId: string) => {
    const timerRef = doc(db, USERS_COLLECTION, userId, 'timer', 'active');
    return deleteDoc(timerRef);
};

export const subscribeToActiveTimer = (userId: string, callback: (state: any | null) => void) => {
    const timerRef = doc(db, USERS_COLLECTION, userId, 'timer', 'active');
    return onSnapshot(timerRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback(null);
        }
    });
};


export const getActiveTimer = async (userId: string) => {
    const timerRef = doc(db, USERS_COLLECTION, userId, 'timer', 'active');
    const docSnap = await getDoc(timerRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};

// Global Contacts Management
const CONTACTS_SUBCOLLECTION = 'contacts';

export const subscribeToGlobalContacts = (userId: string, callback: (contacts: any[]) => void) => {
    const q = query(
        collection(db, USERS_COLLECTION, userId, CONTACTS_SUBCOLLECTION),
        orderBy('lastName'),
        orderBy('firstName')
    );
    return onSnapshot(q, (snapshot) => {
        const contacts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(contacts);
    });
};

export const addGlobalContact = async (userId: string, contact: Omit<any, 'id'>) => {
    // Ensure we don't save undefined
    const cleanContact = JSON.parse(JSON.stringify(contact));

    return addDoc(collection(db, USERS_COLLECTION, userId, CONTACTS_SUBCOLLECTION), {
        ...cleanContact,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
};

export const updateGlobalContact = async (userId: string, contactId: string, data: Partial<any>) => {
    return updateDoc(doc(db, USERS_COLLECTION, userId, CONTACTS_SUBCOLLECTION, contactId), {
        ...data,
        updatedAt: new Date().toISOString()
    });
};

export const deleteGlobalContact = async (userId: string, contactId: string) => {
    return deleteDoc(doc(db, USERS_COLLECTION, userId, CONTACTS_SUBCOLLECTION, contactId));
};
