import { useState } from 'react';

export default function DevTesting() {
    const [id, setId] = useState('');
    const [image, setImage] = useState(null);
    const [fetchId, setFetchId] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [message, setMessage] = useState('');

    const handleImageUpload = async () => {
        const formData = new FormData();
        formData.append('id', id);
        if (image) formData.append('image', image);

        try {
            const res = await fetch('http://localhost:4000/upload-image', {
                method: 'POST',
                body: formData,
            });
            setMessage(await res.text());
        } catch {
            setMessage('Upload failed');
        }
    };

    const fetchImage = async () => {
        try {
            const res = await fetch(`http://localhost:4000/image/${fetchId}`);
            if (!res.ok) {
                setMessage('Image not found');
                return;
            }
            const blob = await res.blob();
            setImageUrl(URL.createObjectURL(blob));
        } catch {
            setMessage('Error fetching image');
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Upload Image</h2>
            <input
                type="text"
                placeholder="Image ID"
                value={id}
                onChange={e => setId(e.target.value)}
            />
            <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files?.[0] || null)}
            />
            <button onClick={handleImageUpload}>Upload</button>

            <h2 style={{ marginTop: '2rem' }}>Fetch Image</h2>
            <input
                type="text"
                placeholder="ID to fetch"
                value={fetchId}
                onChange={e => setFetchId(e.target.value)}
            />
            <button onClick={fetchImage}>Show Image</button>

            {imageUrl && (
                <div style={{ marginTop: '1rem' }}>
                    <h3>Fetched Image:</h3>
                    <img src={imageUrl} alt="Fetched" style={{ maxWidth: '300px' }} />
                </div>
            )}

            {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
        </div>
    );
}