type Page = 'dashboard' | 'links' | 'users' | 'orgs';

interface SidebarProps {
    active: Page;
    onNavigate: (page: Page) => void;
}

const items: { key: Page; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'links', label: 'Links', icon: '🔗' },
    { key: 'users', label: 'Users', icon: '👤' },
    { key: 'orgs', label: 'Orgs', icon: '🏢' },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
    return (
        <aside style={{
            width: '240px',
            minHeight: '100vh',
            background: '#0d0d14',
            borderRight: '1px solid #1e1e30',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{
                padding: '0 24px 28px',
                borderBottom: '1px solid #1e1e30',
                marginBottom: '12px',
            }}>
                <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#6c5ce7' }}>⚡</span> Admin
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>URL Shortener</div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 12px' }}>
                {items.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => onNavigate(item.key)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: active === item.key ? 600 : 400,
                            background: active === item.key ? 'rgba(108, 92, 231, 0.12)' : 'transparent',
                            color: active === item.key ? '#a78bfa' : '#888',
                            transition: 'all 0.15s',
                            textAlign: 'left',
                            width: '100%',
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid #1e1e30' }}>
                <a
                    href="http://localhost:3000"
                    style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}
                >
                    ← Public Site
                </a>
            </div>
        </aside>
    );
}

export type { Page };
