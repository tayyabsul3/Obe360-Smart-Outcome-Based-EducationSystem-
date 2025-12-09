import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set) => ({
    user: null,
    session: null,
    role: null,
    isFirstLogin: false,
    loading: true,

    checkSession: async () => {
        try {
            set({ loading: true });
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const { user } = session;
                // Fetch profile to get role and is_first_login
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, is_first_login')
                    .eq('id', user.id)
                    .single();

                set({
                    user,
                    session,
                    role: profile?.role || 'teacher',
                    isFirstLogin: profile?.is_first_login || false,
                    loading: false
                });
            } else {
                set({ user: null, session: null, role: null, isFirstLogin: false, loading: false });
            }
        } catch (error) {
            console.error('Error checking session:', error);
            set({ loading: false });
        }
    },

    login: async (email, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            const { user, session, role, isFirstLogin } = data;

            if (session) {
                await supabase.auth.setSession(session);
            }

            set({
                user,
                session,
                role: role || 'teacher',
                isFirstLogin: isFirstLogin || false,
                loading: false
            });

            return { success: true, isFirstLogin: isFirstLogin || false };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    register: async (email, password, fullName) => {
        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, fullName })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    inviteTeacher: async (email, fullName, invitedBy) => {
        try {
            const response = await fetch('http://localhost:5000/api/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, fullName, invitedBy })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updatePassword: async (userId, newPassword) => {
        try {
            const response = await fetch('http://localhost:5000/api/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, newPassword })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Refresh session to reflect changes
            await useAuthStore.getState().checkSession();

            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, role: null, isFirstLogin: false });
    },
}));

export default useAuthStore;
