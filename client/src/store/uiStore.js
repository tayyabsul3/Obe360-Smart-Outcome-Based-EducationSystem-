import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
    persist(
        (set) => ({
            fontScale: 'medium', // 'small', 'medium', 'large'
            setFontScale: (scale) => set({ fontScale: scale }),
        }),
        {
            name: 'ui-storage', // unique name
        }
    )
);

export default useUIStore;
