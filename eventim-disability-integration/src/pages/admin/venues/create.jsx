// venues.jsx (Next.js Komponente mit disability area capacities)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function VenueCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        cityId: '',
        capacity: '',
        website: ''
    });
    const [cities, setCities] = useState([]);
    const [areas, setAreas] = useState([]);            // disability_areas
    const [disCaps, setDisCaps] = useState([]);        // [{ area_name, capacity }]
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('http://localhost:4000/cities')
            .then(r => r.json()).then(d => setCities(d.cities));
        fetch('http://localhost:4000/disability-areas')
            .then(r => r.json()).then(d => setAreas(d.areas));
    }, []);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
    };

    const addDisCap = () => {
        setDisCaps(d => [...d, { area_name: '', capacity: '' }]);
    };
    const updateDisCap = (i, field, val) => {
        setDisCaps(d => d.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
    };
    const removeDisCap = i => {
        setDisCaps(d => d.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const total = parseInt(formData.capacity, 10);
        if (!formData.name.trim() ||
            !formData.address.trim() ||
            !formData.cityId ||
            isNaN(total)) {
            setMessage('Name, Adresse, Stadt und Gesamt-Kapazität sind erforderlich');
            setLoading(false);
            return;
        }
        const sumDis = disCaps.reduce((s, dc) => s + (parseInt(dc.capacity,10) || 0), 0);
        if (sumDis > total) {
            setMessage('Summe der Behinderten-Kapazitäten überschreitet Gesamt-Kapazität');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                capacity: total,
                disabilityCapacities: disCaps
            };
            const res = await fetch('http://localhost:4000/create-venue', {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Venue „${data.venue.name}“ erstellt`);
                setFormData({ name:'', address:'', cityId:'', capacity:'', website:'' });
                setDisCaps([]);
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
                {/* Capacity */}
                <div style={{ marginBottom:'1rem' }}>
                    <label htmlFor="capacity" style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Gesamt-Kapazität *</label>
                    <input id="capacity" name="capacity" type="number" min="0"
                           value={formData.capacity} onChange={handleChange} required
                           style={{ width:'100%', padding:'.5rem', borderRadius:'4px', border:'1px solid #ccc' }}
                    />
                </div>
                {/* Website */}
                <div style={{ marginBottom:'1rem' }}>
                    <label htmlFor="website" style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Website</label>
                    <input id="website" name="website" type="url" value={formData.website}
                           onChange={handleChange} placeholder="https://example.com"
                           style={{ width:'100%', padding:'.5rem', borderRadius:'4px', border:'1px solid #ccc' }}
                    />
                </div>
                {/* Disability capacities */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Behinderten-Kapazität hinzufügen</label>
                    {disCaps.map((dc,i) => (
                        <div key={i} style={{ display:'flex', gap:'1rem', marginBottom:'.5rem' }}>
                            <select value={dc.area_name}
                                    onChange={e=>updateDisCap(i,'area_name',e.target.value)}
                                    required
                                    style={{ flex:2, padding:'.5rem', border:'1px solid #ccc', borderRadius:'4px' }}
                            >
                                <option value="">Bereich wählen</option>
                                {areas.map(a=>(
                                    <option key={a.area_name} value={a.area_name}>
                                        {a.area_name}
                                    </option>
                                ))}
                            </select>
                            <input type="number" min="0" placeholder="Kapazität"
                                   value={dc.capacity}
                                   onChange={e=>updateDisCap(i,'capacity',e.target.value)}
                                   required
                                   style={{ flex:1, padding:'.5rem', border:'1px solid #ccc', borderRadius:'4px' }}
                            />
                            <button type="button" onClick={()=>removeDisCap(i)}
                                    style={{ background:'transparent', border:'none', color:'#c00', fontSize:'1.25rem' }}>✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={addDisCap}
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