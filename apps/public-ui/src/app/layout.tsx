import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "URL Shortener – Shorten, Track & Share Links",
  description: "Production-grade URL shortener with analytics, QR codes, and custom domains. Shorten URLs in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 40px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <Link href="/" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--accent)' }}>⚡</span> URLShortner
          </Link>
          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Home</Link>
            <Link href="/analytics" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Analytics</Link>
            <a
              href="http://localhost:5173"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              Admin →
            </a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
