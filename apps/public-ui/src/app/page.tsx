import ShortenForm from './components/ShortenForm';

export default function Home() {
  return (
    <div style={{ minHeight: 'calc(100vh - 65px)' }}>
      {/* Hero */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 20px 60px',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, var(--accent-glow), transparent)',
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--accent)',
          background: 'rgba(108, 92, 231, 0.1)',
          border: '1px solid rgba(108, 92, 231, 0.2)',
          padding: '6px 14px',
          borderRadius: '20px',
          marginBottom: '20px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          ⚡ 1B+ Redirects/Month
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          maxWidth: '700px',
          marginBottom: '16px',
        }}>
          Shorten URLs.{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Track clicks.
          </span>
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          maxWidth: '500px',
          lineHeight: 1.6,
          marginBottom: '40px',
        }}>
          Production-grade URL shortener with real-time analytics,
          QR codes, custom aliases, and sub-50ms redirects.
        </p>

        <div style={{ width: '100%', maxWidth: '640px' }}>
          <ShortenForm />
        </div>
      </section>

      {/* Features */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        padding: '40px 40px 80px',
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        {[
          { icon: '⚡', title: 'Sub-50ms Redirects', desc: 'Redis-cached hot path with singleflight protection.' },
          { icon: '📊', title: 'Real-Time Analytics', desc: 'ClickHouse-powered analytics with geo, device, and referrer data.' },
          { icon: '🔗', title: 'Custom Aliases', desc: 'Brand your links with memorable custom short codes.' },
          { icon: '📱', title: 'QR Codes', desc: 'Auto-generated QR codes for every short link.' },
          { icon: '🔒', title: 'Password Protection', desc: 'Secure links with optional password gates.' },
          { icon: '⏰', title: 'Expiry & TTL', desc: 'Auto-expire links after a set date or time.' },
        ].map((f) => (
          <div key={f.title} style={{
            padding: '24px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{f.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
