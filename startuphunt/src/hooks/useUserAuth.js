import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useUserAuth = (navigate, setSnackbar) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) {
                    setSnackbar({
                        open: true,
                        message: 'Authentication error. Please refresh and try again.',
                        severity: 'error',
                    });
                    return;
                }
                const currentUser = data?.user || null;
                if (!currentUser) {
                    setSnackbar({ open: true, message: 'Please sign in to submit a project', severity: 'warning' });
                    navigate('/UserRegister');
                    return;
                }
                setUser(currentUser);
            } catch (error) {
                setSnackbar({
                    open: true,
                    message: 'Authentication error. Please refresh and try again.',
                    severity: 'error',
                });
            }
        };
        checkUser();
    }, [navigate, setSnackbar]);

    return user;
};

