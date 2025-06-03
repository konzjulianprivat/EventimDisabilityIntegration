// hooks/useAuth.js
"use client";

import { useState, useEffect } from 'react';

export function useAuth() {
    const [authState, setAuthState] = useState({
        loading: true,
        loggedIn: false,
        user: null,
    });

    useEffect(() => {
        // 1) Direkt aus localStorage (falls vorhanden) setzen
        const cached = localStorage.getItem('user');
        if (cached) {
            try {
                const u = JSON.parse(cached);
                setAuthState({
                    loading: false,
                    loggedIn: true,
                    user: {
                        userId:    u.userId,
                        email:     u.email,
                        firstName: u.firstName,
                        lastName:  u.lastName,
                    },
                });
            } catch {
                localStorage.removeItem('user');
            }
        }

        // 2) Parallel die echte Session beim Server prüfen
        async function checkSession() {
            try {
                const res = await fetch('http://localhost:4000/session-status', {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await res.json();
                if (data.loggedIn) {
                    setAuthState({
                        loading: false,
                        loggedIn: true,
                        user: {
                            userId:    data.user.userId,
                            email:     data.user.email,
                            firstName: data.user.firstName,
                            lastName:  data.user.lastName,
                        },
                    });
                    localStorage.setItem(
                        'user',
                        JSON.stringify({
                            userId:    data.user.userId,
                            email:     data.user.email,
                            firstName: data.user.firstName,
                            lastName:  data.user.lastName,
                        })
                    );
                } else {
                    setAuthState({ loading: false, loggedIn: false, user: null });
                    localStorage.removeItem('user');
                }
            } catch {
                setAuthState({ loading: false, loggedIn: false, user: null });
                localStorage.removeItem('user');
            }
        }

        checkSession();
    }, []);

    return authState;
}