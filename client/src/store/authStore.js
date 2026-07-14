import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const saveAdminIdToStorage = (user, role) => {
    if (!user) {
        localStorage.removeItem('admin_id');
        return;
    }
    const adminId = role === 'admin' ? user.id : user.user_metadata?.admin_id;
    if (adminId) {
        localStorage.setItem('admin_id', adminId);
    } else {
        localStorage.removeItem('admin_id');
    }
};

const useAuthStore = create((set) => ({
    user: null,
    session: null,
    role: null,
    isFirstLogin: false,
    loading: true,

    checkSession: async () => {
        try {
            set({ loading: true });

            // Create a timeout promise to prevent infinite hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session check timed out')), 8000)
            );

            // Race the supabase call against the timeout
            const sessionPromise = supabase.auth.getSession();
            
            const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

            if (session) {
                const { user } = session;
                // Fetch profile to get role, is_first_login, and is_active
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, is_first_login, admin_id, organization_name, organization_code, is_active')
                    .eq('id', user.id)
                    .single();

                if (profile && profile.is_active === false) {
                    await supabase.auth.signOut();
                    saveAdminIdToStorage(null);
                    set({ user: null, session: null, role: null, isFirstLogin: false, loading: false });
                    return;
                }

                if (user && profile) {
                    user.user_metadata = {
                        ...user.user_metadata,
                        role: profile.role || user.user_metadata?.role,
                        admin_id: profile.admin_id,
                        organization_name: profile.organization_name,
                        organization_code: profile.organization_code
                    };
                }

                // Resolve role: DB profile takes priority, then JWT metadata, then fallback
                const resolvedRole = profile?.role || user?.user_metadata?.role || 'teacher';

                // If profile.role is missing but metadata has it, patch it now
                if (!profile?.role && user?.user_metadata?.role) {
                    supabase.from('profiles').update({ role: user.user_metadata.role }).eq('id', user.id).then(() => {
                        console.log('[SESSION] Patched missing profile role from user_metadata:', user.user_metadata.role);
                    });
                }

                saveAdminIdToStorage(user, resolvedRole);

                set({
                    user,
                    session,
                    role: resolvedRole,
                    isFirstLogin: profile?.is_first_login || false,
                    loading: false
                });
            } else {
                saveAdminIdToStorage(null);
                set({ user: null, session: null, role: null, isFirstLogin: false, loading: false });
            }
        } catch (error) {
            console.error('Error checking session:', error);
            saveAdminIdToStorage(null);
            set({ loading: false });
        }
    },

    login: async (email, password, rememberMe = false) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            if (data.requires2FA) {
                return { success: true, requires2FA: true, email: data.email };
            }

            const { user, session, role, isFirstLogin } = data;

            if (session) {
                await supabase.auth.setSession(session);

                // If "Remember Me" is NOT checked, remove the persisted session
                if (!rememberMe) {
                    localStorage.removeItem('sb-pjrinmkrdpxwkfzsmvob-auth-token');
                }
            }

            saveAdminIdToStorage(user, role);

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

    verify2FA: async (email, code) => {
        try {
            const response = await fetch('/api/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            const { user, session, role, isFirstLogin } = data;

            if (session) {
                await supabase.auth.setSession(session);
            }

            saveAdminIdToStorage(user, role);

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

    register: async (email, password, fullName, adminKey, organizationName, organizationCode) => {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, fullName, adminKey, organizationName, organizationCode })
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
            const response = await fetch('/api/invite', {
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

    updatePassword: async (userId, newPassword, oldPassword, email) => {
        try {
            // 1. Verify old password if provided
            if (oldPassword && email) {
                const { error: verifyError } = await supabase.auth.signInWithPassword({
                    email,
                    password: oldPassword
                });
                if (verifyError) {
                    throw new Error("Incorrect current password");
                }
            }

            // 2. Update password via Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (authError) throw authError;

            // 3. Update is_first_login directly on profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ is_first_login: false })
                .eq('id', userId);
            if (profileError) throw profileError;

            // 4. Refresh session state
            await useAuthStore.getState().checkSession();

            return { success: true, message: "Password updated successfully!" };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateProfile: async (userId, fullName) => {
        try {
            const response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, fullName })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            await useAuthStore.getState().checkSession();

            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        saveAdminIdToStorage(null);
        set({ user: null, session: null, role: null, isFirstLogin: false });
    },
}));

export default useAuthStore;
