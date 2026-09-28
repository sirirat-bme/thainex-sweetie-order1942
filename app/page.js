import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center', color: '#4a5568' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#d53f8c' }}>🍧 Thainexsweetie</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        ยินดีต้อนรับสู่ระบบสั่งอาหารร้านขนมหวาน Thainexsweetie
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link 
          href="/generate-qr" 
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ed64a6',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          สร้าง QR Code (Generate QR)
        </Link>
        
        <Link 
          href="/kitchen" 
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4299e1',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          ห้องครัว (Kitchen)
        </Link>
      </div>
    </main>
  )
}
