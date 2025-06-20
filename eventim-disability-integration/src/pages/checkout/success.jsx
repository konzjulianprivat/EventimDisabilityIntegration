// pages/order-success.jsx
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function OrderSuccess() {
    const router = useRouter()
    const { from } = router.query
    const [count, setCount] = useState(3)

    // 1) guard: only allow if from === 'payment'
    useEffect(() => {
        if (!router.isReady) return
        if (from !== 'payment') {
            router.replace('/')
        }
    }, [router, router.isReady, from])

    // 2) countdown & auto-redirect
    useEffect(() => {
        if (from !== 'payment') return
        if (count <= 0) {
            router.replace('/')
            return
        }
        const timer = setTimeout(() => setCount(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [count, from, router])

    // 3) render nothing until the guard has passed
    if (!router.isReady || from !== 'payment') {
        return null
    }
    return (
        <div className="custom404-wrapper">
            <div className="success-message" style={{ maxWidth: '600px', padding: '3rem', borderColor: "green", boxShadow: "0 0 8px 4px darkgreen, 0 0 6px 3px green, 0 0 8px 4px lightgreen" }}>
                <h1 className="custom404-code" style={{fontSize: "3rem", color: "green"}}>Bestellung erfolgreich!</h1>
                <p className="custom404-message">
                    Glückwunsch! Ihre Bestellung wurde erfolgreich abgeschlossen. Du erhältst eine Bestätigungs-E-Mail mit den Details deiner Bestellung. Vielen Dank für deinen Einkauf!
                </p>
                <button
                    className="orderSuccess-button"
                    onClick={() => router.replace('/')}
                >
                    Zur Startseite ({count}s)
                </button>
            </div>
        </div>
    )
}