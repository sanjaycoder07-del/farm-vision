import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#2e7d32' }}>Welcome to AgriRisk</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        Select a dashboard to view the interface for each user role.
      </p>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
        <Link href="/farmer" style={linkStyle}>
          👨‍🌾 Farmer Dashboard
        </Link>
        <Link href="/buyer" style={linkStyle}>
          🛒 Buyer Dashboard
        </Link>
        <Link href="/agent" style={linkStyle}>
          📋 Insurance Agent Dashboard
        </Link>
        <Link href="/admin" style={linkStyle}>
          ⚙️ Admin Dashboard
        </Link>
      </div>
    </main>
  );
}

const linkStyle = {
  display: 'block',
  padding: '1.5rem',
  backgroundColor: '#f4f6f8',
  border: '1px solid #ddd',
  borderRadius: '8px',
  textDecoration: 'none',
  color: '#333',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  textAlign: 'center',
  transition: 'background 0.2s',
};
