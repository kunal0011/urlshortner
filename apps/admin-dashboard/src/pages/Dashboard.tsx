import { useEffect, useState } from 'react';
import { fetchStats, type Stats } from '../lib/api';

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-loading">Loading...</div>;

    return (
        <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Platform overview and key metrics</p>

            <div className="stats-grid">
                <StatCard label="Total Links" value={stats?.total_links ?? 0} icon="🔗" color="#6c5ce7" />
                <StatCard label="Total Users" value={stats?.total_users ?? 0} icon="👤" color="#00d2a0" />
                <StatCard label="Total Orgs" value={stats?.total_orgs ?? 0} icon="🏢" color="#ffa502" />
                <StatCard label="Total Clicks" value={stats?.total_clicks ?? 0} icon="📊" color="#ff4757" />
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
            <div>
                <div className="stat-value">{value.toLocaleString()}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}
