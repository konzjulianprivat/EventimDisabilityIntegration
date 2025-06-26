// venues.jsx (Next.js Komponente mit disability area capacities)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function VenueCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        cityId: '',
        website: ''
    });
    const [cities, setCities] = useState([]);
    const [areas, setAreas] = useState([]);
    const [venueAreas, setVenueAreas] = useState([]); // [{ areaId, maxCapacity }]
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('http://localhost:4000/cities')
            .then(r => r.json()).then(d => setCities(d.cities));
        fetch('http://localhost:4000/areas')
            .then(r => r.json()).then(d => setAreas(d.areas));
    }, []);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
    };

    const addArea = () => {
        setVenueAreas(v => [...v, { areaId: '', maxCapacity: '' }]);
    };
    const updateArea = (i, field, val) => {
        setVenueAreas(v => v.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
    };
    const removeArea = i => {
        setVenueAreas(v => v.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        if (!formData.name.trim() || !formData.address.trim() || !formData.cityId) {
            setMessage('Name, Adresse und Stadt sind erforderlich');
            setLoading(false);
            return;
        }
        for (const va of venueAreas) {
            if (!va.areaId || !va.maxCapacity) {
                setMessage('Alle Bereiche benötigen eine Kapazität und Auswahl');
                setLoading(false);
                return;
            }
        }

        try {
            const payload = {
                ...formData,
                venueAreas
            };
            const res = await fetch('http://localhost:4000/create-venue', {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Venue „${data.venue.name}“ erstellt`);
                setFormData({ name:'', address:'', cityId:'', website:'' });
                setVenueAreas([]);
            } else {
                setMessage(data.message || 'Fehler beim Erstellen');
            }
        } catch (err) {
            console.error(err);
            setMessage('Serverfehler');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-container" style={{ maxWidth:'600px', margin:'0 auto', padding:'2rem' }}>
            <h1 style={{ color:'#002b55', marginBottom:'1.5rem' }}>Neuen Veranstaltungsort anlegen</h1>
            {message && (
                <div style={{
                    padding:'0.75rem',
                    backgroundColor: message.includes('erstellt') ? '#d4edda' : '#f8d7da',
                    color: message.includes('erstellt') ? '#155724' : '#721c24',
                    borderRadius:'4px', marginBottom:'1rem'
                }}>{message}</div>
            )}
            <form onSubmit={handleSubmit}>
                {/* Name */}
                <div style={{ marginBottom:'1rem' }}>
                    <label htmlFor="name" style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Name *</label>
                    <input id="name" name="name" type="text" value={formData.name}
                           onChange={handleChange} required
                           style={{ width:'100%', padding:'.5rem', borderRadius:'4px', border:'1px solid #ccc' }}
                    />
                </div>
                {/* Address */}
                <div style={{ marginBottom:'1rem' }}>
                    <label htmlFor="address" style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Adresse *</label>
                    <input id="address" name="address" type="text" value={formData.address}
                           onChange={handleChange} required
                           style={{ width:'100%', padding:'.5rem', borderRadius:'4px', border:'1px solid #ccc' }}
                    />
                </div>
                {/* City */}
                <div style={{ marginBottom:'1rem' }}>
                    <label htmlFor="cityId" style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Stadt *</label>
                    <select id="cityId" name="cityId" value={formData.cityId}
                            onChange={handleChange} required
                            style={{ width:'100%', padding:'.5rem', borderRadius:'4px', border:'1px solid #ccc' }}
                    >
                        <option value="">Bitte wählen</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                {/* Website */}
                <div style={{ marginBottom:'1rem' }}>
                    <label htmlFor="website" style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Website</label>
                    <input id="website" name="website" type="url" value={formData.website}
                           onChange={handleChange} placeholder="https://example.com"
                           style={{ width:'100%', padding:'.5rem', borderRadius:'4px', border:'1px solid #ccc' }}
                    />
                </div>
                {/* Areas */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Bereiche hinzufügen</label>
                    {venueAreas.map((va,i) => (
                        <div key={i} style={{ display:'flex', gap:'1rem', marginBottom:'.5rem' }}>
                            <select value={va.areaId}
                                    onChange={e=>updateArea(i,'areaId',e.target.value)}
                                    required
                                    style={{ flex:2, padding:'.5rem', border:'1px solid #ccc', borderRadius:'4px' }}
                            >
                                <option value="">Bereich wählen</option>
                                {areas.map(a=>(
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            <input type="number" min="0" placeholder="Kapazität"
                                   value={va.maxCapacity}
                                   onChange={e=>updateArea(i,'maxCapacity',e.target.value)}
                                   required
                                   style={{ flex:1, padding:'.5rem', border:'1px solid #ccc', borderRadius:'4px' }}
                            />
                            <button type="button" onClick={()=>removeArea(i)}
                                    style={{ background:'transparent', border:'none', color:'#c00', fontSize:'1.25rem' }}>✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={addArea}
                            style={{ background:'#eee', border:'1px solid #ccc', padding:'.5rem', borderRadius:'4px' }}>
                        + Bereich hinzufügen
                    </button>
                </div>
                {/* Submit */}
                <button type="submit" disabled={loading}
                        style={{ backgroundColor:'#002b55', color:'white', padding:'0.75rem 1.5rem',
                            border:'none', borderRadius:'4px', fontSize:'1rem', cursor:'pointer', width:'100%' }}>
                    {loading?'Bitte warten...':'Venue erstellen'}
                </button>
            </form>
        </div>
    );
}