import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSemesterStore = create(
    persist(
        (set, get) => ({
            workingSemesterId: null, // Academic Session (e.g., Fall 2024)
            semesters: [],
            programs: [],

            // Teacher Portal Context
            selectedProgramId: null,
            selectedSemesterNum: null,
            activeCourseId: null,

            setWorkingSemesterId: (id) => set({ workingSemesterId: id }),
            setSelectedProgramId: (id) => set({ selectedProgramId: id, activeCourseId: null }),
            setSelectedSemesterNum: (num) => set({ selectedSemesterNum: num, activeCourseId: null }),
            setActiveCourseId: (id) => set({ activeCourseId: id }),

            fetchPrograms: async () => {
                try {
                    const res = await fetch('http://localhost:5000/api/programs');
                    if (res.ok) {
                        const data = await res.json();
                        set({ programs: data });
                    }
                } catch (error) {
                    console.error("Failed to fetch programs", error);
                }
            },

            setSemesters: (semesters) => set({
                semesters,
                workingSemesterId: semesters.length > 0 && !get().workingSemesterId
                    ? semesters.find(s => s.is_active)?.id || semesters[0].id
                    : get().workingSemesterId
            }),

            fetchSemesters: async () => {
                try {
                    const res = await fetch('http://localhost:5000/api/semesters');
                    if (res.ok) {
                        const data = await res.json();
                        set({ semesters: data });

                        // Seed working semester if missing
                        const currentState = get();
                        if (!currentState.workingSemesterId && data.length > 0) {
                            const active = data.find(s => s.is_active) || data[0];
                            set({ workingSemesterId: active.id });
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch semesters", error);
                }
            }
        }),
        {
            name: 'semester-storage',
        }
    )
);

export default useSemesterStore;
