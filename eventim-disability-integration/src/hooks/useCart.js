// ── hooks/useCart.js ──
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from './useAuth';

const CartContext = createContext();

export function CartProvider({ children }) {
    const { loading: authLoading, loggedIn } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [counts, setCounts] = useState({});

    const fetchCart = useCallback(async () => {
        if (authLoading) return;
        if (!loggedIn) {
            setItems([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cart-items`, { credentials: 'include' });
            if (res.ok) {
                const { items } = await res.json();
                setItems(items || []);
                const agg = {};
                (items || []).forEach((it) => {
                    const eid = it.event_id;
                    const isDisabled = it.disability_support_for !== null && it.disability_support_for !== undefined;
                    if (!agg[eid]) agg[eid] = { regular: 0, disabled: 0 };
                    if (isDisabled) agg[eid].disabled += Number(it.quantity);
                    else agg[eid].regular += Number(it.quantity);
                });
                setCounts(agg);
            } else {
                setItems([]);
                setCounts({});
            }
        } catch {
            setItems([]);
            setCounts({});
        } finally {
            setLoading(false);
        }
    }, [authLoading, loggedIn]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // call this after any add/patch/delete to refresh
    const reload = useCallback(fetchCart, [fetchCart]);

    return (
        <CartContext.Provider value={{ items, loading, reload, counts }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be inside CartProvider');
    return ctx;
}
