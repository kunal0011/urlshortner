'use client';

import { useState } from 'react';
import { getAnalyticsSummary, type AnalyticsSummary } from '../lib/api';

export default function AnalyticsPage() {
    const [code, setCode] = useState('');
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setLoading(true);
        setError('');
        setData(null);
        try {
            const result = await getAnalyticsSummary(code);
            setData(result);
        } catch {
            setError('No analytics found for this short code. Make sure the code exists and has received clicks.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '60px 20px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Link Analytics
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
                Enter a short code to view click analytics, geographic data, and device breakdown.
            </p>

            <form onSubmit={handleLookup} style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter short code (e.g. pgQML1y)"
                    style={{
                        flex: 1,
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                        outline: 'none',
                    }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '14px 28px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'var(--accent)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px var(--accent-glow)',
                    }}
                >
                    {loading ? 'Loading...' : 'Lookup'}
                </button>
            </form>

            {error && (
                <div style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 71, 87, 0.08)',
                    border: '1px solid rgba(255, 71, 87, 0.2)',
                    color: 'var(--danger)',
                    fontSize: '14px',
                    marginBottom: '20px',
                }}>
                    {error}
                </div>
            )}

            {data && (
                <div>
                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <StatCard label="Total Clicks" value={data.total_clicks} />
                        <StatCard label="Unique Visitors" value={data.unique_visitors} />
                    </div>

                    {/* Top Countries */}
                    {data.top_countries && data.top_countries.length > 0 && (
                        <div style={{
                            padding: '20px',
                            borderRadius: '14px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            marginBottom: '16px',
                        }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>
                                Top Countries
                            </h3>
                            {data.top_countries.map((c) => (
                                <div key={c.country} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border)',
                                    fontSize: '14px',
                                }}>
                                    <span>{c.country}</span>
                                    <span style={{ fontWeight: 600 }}>{c.clicks}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Top Browsers */}
                    {data.top_browsers && data.top_browsers.length > 0 && (
                        <div style={{
                            padding: '20px',
                            borderRadius: '14px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                        }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>
                                Top Browsers
                            </h3>
                            {data.top_browsers.map((b) => (
                                <div key={b.browser} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border)',
                                    fontSize: '14px',
                                }}>
                                    <span>{b.browser}</span>
                                    <span style={{ fontWeight: 600 }}>{b.clicks}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div style={{
            padding: '20px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
        }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>
                {(value ?? 0).toLocaleString()}
            </div>
        </div>
    );
}
