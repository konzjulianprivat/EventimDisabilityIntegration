import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './useAuth';

export function useRequireAccess(required = []) {
    const { loading, loggedIn, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        const allowed = required.every((f) => user && user[f]);
        if (!loggedIn) {
            router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        } else if (!allowed) {
            router.replace('/');
        }
    }, [loading, loggedIn, user, router, required]);

    return { loading, loggedIn, user };
}
