
import { db } from '@/firebaseConfig';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const DEFAULT_TABS = {
    dsa: 'DSA',
    infosec: 'Security',
    network: 'Network',
    general: 'General'
};

export const updateTabSettings = async (newTabs: typeof DEFAULT_TABS) => {
    try {
        await setDoc(doc(db, 'settings', 'tabs'), newTabs);
        return true;
    } catch (e) {
        console.error("Error updating tabs", e);
        return false;
    }
};

export const useTabSettings = () => {
    const [tabs, setTabs] = useState(DEFAULT_TABS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'tabs'), (doc) => {
            if (doc.exists()) {
                setTabs(doc.data() as typeof DEFAULT_TABS);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return { tabs, loading };
};
