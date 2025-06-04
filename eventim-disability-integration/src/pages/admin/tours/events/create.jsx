import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EventCreation() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        tourId: '',
        venueId: '',
        doorTime: '',
        startTime: '',
        endTime: '',
        description: ''
    });
    const [tours, setTours] = useState([]);
    const [venues, setVenues] = useState([]);
    const [artists, setArtists] = useState([]);
    const [eventArtists, setEventArtists] = useState([]); // [{ artistId, role }]
    const [venueAreas, setVenueAreas] = useState([]); // fetched based on venue
    const [categories, setCategories] = useState([]); // [{ name, price, areas:[{ venueAreaId, capacity }] }]
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('http://localhost:4000/tours')
            .then(r => r.json()).then(d => setTours(d.tours));
        fetch('http://localhost:4000/venues')
            .then(r => r.json()).then(d => setVenues(d.venues));
        fetch('http://localhost:4000/artists')
            .then(r => r.json()).then(d => setArtists(d.artists));
    }, []);

    useEffect(() => {
        if (!formData.venueId) {
            setVenueAreas([]);
            return;
        }
        fetch(`http://localhost:4000/venue-areas?venueId=${formData.venueId}`)
            .then(r => r.json())
            .then(d => setVenueAreas(d.venueAreas || []))
            .catch(err => {
                console.error('Error loading venue areas', err);
                setVenueAreas([]);
            });
    }, [formData.venueId]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(f => ({ ...f, [name]: value }));
    };

    const addArtist = () => {
        setEventArtists(ea => [...ea, { artistId: ''}]);
    };
    const updateArtist = (i, field, val) => {
        setEventArtists(ea => ea.map((it, idx) => idx===i ? { ...it, [field]: val } : it));
    };
    const removeArtist = i => {
        setEventArtists(ea => ea.filter((_,idx)=>idx!==i));
    };

    const addCategory = () => {
        const idx = categories.length + 1;
        setCategories(c => [
            ...c,
            { name: `Kategorie ${idx}`, price: '', areas: [{ venueAreaId: '', capacity: '' }] },
        ]);
    };
    const updateCategory = (i, field, val) => {
        setCategories(c => c.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
    };
    const removeCategory = i => {
        setCategories(c => c.filter((_,idx)=>idx!==i));
    };

    const addAreaToCategory = (catIdx) => {
        setCategories(c =>
            c.map((cat, idx) =>
                idx === catIdx
                    ? { ...cat, areas: [...cat.areas, { venueAreaId: '', capacity: '' }] }
                    : cat
            )
        );
    };

    const updateAreaInCategory = (catIdx, areaIdx, field, val) => {
        setCategories(c =>
            c.map((cat, idx) => {
                if (idx !== catIdx) return cat;
                const newAreas = cat.areas.map((a, i) =>
                    i === areaIdx ? { ...a, [field]: val } : a
                );
                return { ...cat, areas: newAreas };
            })
        );
    };

    const removeAreaFromCategory = (catIdx, areaIdx) => {
        setCategories(c =>
            c.map((cat, idx) => {
                if (idx !== catIdx) return cat;
                const newAreas = cat.areas.filter((_, i) => i !== areaIdx);
                return { ...cat, areas: newAreas };
            })
        );
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const { tourId, venueId, doorTime, startTime, endTime } = formData;
        if (!tourId||!venueId||!doorTime||!startTime||!endTime) {
            setMessage('Tour, Venue und alle Zeiten sind erforderlich');
            setLoading(false);
            return;
        }
        for (const cat of categories) {
            if (!cat.price || !cat.name.trim()) {
                setMessage('Alle Kategorien benötigen einen Namen und Preis');
                setLoading(false);
                return;
            }
            if (!Array.isArray(cat.areas) || cat.areas.length === 0) {
                setMessage('Jede Kategorie benötigt mindestens einen Bereich');
                setLoading(false);
                return;
            }
            for (const a of cat.areas) {
                if (!a.venueAreaId || !a.capacity) {
                    setMessage('Alle Bereichseinträge benötigen Kapazität und Auswahl');
                    setLoading(false);
                    return;
                }
            }
        }
        try {
            const payload = { ...formData, eventArtists, categories };
            const res = await fetch('http://localhost:4000/create-event', {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`Event erstellt`);
                setFormData({ tourId:'', venueId:'', doorTime:'', startTime:'', endTime:'', description:'' });
                setEventArtists([]);
                setCategories([]);
            } else {
                setMessage(data.message||'Fehler beim Erstellen');
            }
        } catch(err) {
            console.error(err);
            setMessage('Serverfehler');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-container" style={{ maxWidth:'600px', margin:'0 auto', padding:'2rem' }}>
            <h1 style={{ color:'#002b55', marginBottom:'1.5rem' }}>Neues Event erstellen</h1>
            {message && (
                <div style={{
                    padding:'0.75rem',
                    backgroundColor: message.includes('erstellt')?'#d4edda':'#f8d7da',
                    color: message.includes('erstellt')?'#155724':'#721c24',
                    borderRadius:'4px', marginBottom:'1rem'
                }}>{message}</div>
            )}
            <form onSubmit={handleSubmit}>
                {/* Tour */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Tour *</label>
                    <select name="tourId" value={formData.tourId} onChange={handleChange} required
                            style={{ width:'100%',padding:'.5rem',border:'1px solid #ccc',borderRadius:'4px' }}>
                        <option value="">Bitte wählen</option>
                        {tours.map(t => <option key={t.id} value={t.id}>{t.title||t.id}</option>)}
                    </select>
                </div>
                {/* Venue */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Venue *</label>
                    <select name="venueId" value={formData.venueId} onChange={handleChange} required
                            style={{ width:'100%',padding:'.5rem',border:'1px solid #ccc',borderRadius:'4px' }}>
                        <option value="">Bitte wählen</option>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
                {/* Door Time */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Einlasszeit *</label>
                    <input type="datetime-local" name="doorTime" value={formData.doorTime}
                           onChange={handleChange} required
                           style={{ width:'100%',padding:'.5rem',border:'1px solid #ccc',borderRadius:'4px' }}/>
                </div>
                {/* Start Time */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Beginn *</label>
                    <input type="datetime-local" name="startTime" value={formData.startTime}
                           onChange={handleChange} required
                           style={{ width:'100%',padding:'.5rem',border:'1px solid #ccc',borderRadius:'4px' }}/>
                </div>
                {/* End Time */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Ende *</label>
                    <input type="datetime-local" name="endTime" value={formData.endTime}
                           onChange={handleChange} required
                           style={{ width:'100%',padding:'.5rem',border:'1px solid #ccc',borderRadius:'4px' }}/>
                </div>
                {/* Description */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Beschreibung</label>
                    <textarea name="description" value={formData.description} onChange={handleChange}
                              rows={3}
                              style={{ width:'100%',padding:'.5rem',border:'1px solid #ccc',borderRadius:'4px' }}/>
                </div>
                {/* Artists */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Begleitungs-Acts hinzufügen</label>
                    {eventArtists.map((ea,i)=>(
                        <div key={i} style={{ display:'flex',gap:'1rem',marginBottom:'.5rem' }}>
                            <select value={ea.artistId}
                                    onChange={e=>updateArtist(i,'artistId',e.target.value)}
                                    required
                                    style={{ flex:2,padding:'.5rem',border:'1px solid #ccc',borderRadius:'4px' }}>
                                <option value="">Begleitungs-Acts wählen</option>
                                {artists.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <button type="button" onClick={()=>removeArtist(i)}
                                    style={{ background:'transparent',border:'none',color:'#c00',fontSize:'1.25rem' }}>✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={addArtist}
                            style={{ background:'#eee',border:'1px solid #ccc',padding:'.5rem',borderRadius:'4px' }}>
                        + Künstler hinzufügen
                    </button>
                </div>

                {/* Kategorien */}
                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Kategorien</label>
                    {categories.map((c,i)=>(
                        <div key={i} style={{ marginBottom:'1rem', padding:'1rem', border:'1px solid #ddd', borderRadius:'4px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                                <strong>Kategorie {i+1}</strong>
                                <button type="button" onClick={()=>removeCategory(i)} style={{ background:'transparent',border:'none',color:'#c00',fontSize:'1.25rem' }}>✕</button>
                            </div>
                            <input type="text" value={c.name} onChange={e=>updateCategory(i,'name',e.target.value)}
                                   style={{ width:'100%', padding:'.5rem', border:'1px solid #ccc', borderRadius:'4px', marginBottom:'0.5rem' }}/>
                            <input type="number" min="0" placeholder="Preis" value={c.price}
                                   onChange={e=>updateCategory(i,'price',e.target.value)}
                                   style={{ width:'100%', padding:'.5rem', border:'1px solid #ccc', borderRadius:'4px', marginBottom:'0.5rem' }}/>
                            <label style={{ display:'block', fontWeight:'bold', marginBottom:'.5rem' }}>Bereiche</label>
                            {c.areas.map((a,ai)=>(
                                <div key={ai} style={{ display:'flex', gap:'1rem', marginBottom:'.5rem' }}>
                                    <select value={a.venueAreaId} onChange={e=>updateAreaInCategory(i,ai,'venueAreaId',e.target.value)}
                                            required style={{ flex:2, padding:'.5rem', border:'1px solid #ccc', borderRadius:'4px' }}>
                                        <option value="">Bereich wählen</option>
                                        {venueAreas.map(va=> (
                                            <option key={va.id} value={va.id}>{va.name} (max {va.max_capacity})</option>
                                        ))}
                                    </select>
                                    <input type="number" min="0" placeholder="Kapazität" value={a.capacity}
                                           onChange={e=>updateAreaInCategory(i,ai,'capacity',e.target.value)}
                                           required style={{ flex:1, padding:'.5rem', border:'1px solid #ccc', borderRadius:'4px' }} />
                                    <button type="button" onClick={()=>removeAreaFromCategory(i,ai)} style={{ background:'transparent', border:'none', color:'#c00', fontSize:'1.25rem' }}>✕</button>
                                </div>
                            ))}
                            <button type="button" onClick={()=>addAreaToCategory(i)} style={{ background:'#eee', border:'1px solid #ccc', padding:'.5rem', borderRadius:'4px', marginBottom:'0.5rem' }}>+ Bereich hinzufügen</button>
                        </div>
                    ))}
                    <button type="button" onClick={addCategory} style={{ background:'#eee',border:'1px solid #ccc',padding:'.5rem',borderRadius:'4px' }}>+ Kategorie hinzufügen</button>
                </div>
                {/* Submit */}
                <button type="submit" disabled={loading}
                        style={{ backgroundColor:'#002b55',color:'white',padding:'0.75rem 1.5rem',
                            border:'none',borderRadius:'4px',fontSize:'1rem',cursor:'pointer', width:'100%' }}>
                    {loading?'Bitte warten...':'Event erstellen'}
                </button>
            </form>
        </div>
    );
}
