'use client';

import { useState } from 'react';
import { createLink, type Link } from '../lib/api';

export default function ShortenForm() {
    const [url, setUrl] = useState('');
    const [alias, setAlias] = useState('');
    const [result, setResult] = useState<Link | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const link = await createLink(url, alias || undefined);
            setResult(link);
            setUrl('');
            setAlias('');
        } catch {
            setError('Failed to shorten URL. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste your long URL here..."
                        required
                        style={{
                            flex: 1,
                            padding: '14px 18px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !url}
                        style={{
                            padding: '14px 32px',
                            borderRadius: '12px',
                            border: 'none',
                            background: loading ? 'var(--border)' : 'var(--accent)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: loading ? 'none' : '0 4px 20px var(--accent-glow)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {loading ? 'Shortening...' : 'Shorten'}
                    </button>
                </div>

                <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Custom alias (optional)"
                    style={{
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        width: '250px',
                    }}
                />
            </form>

            {error && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 71, 87, 0.1)',
                    border: '1px solid rgba(255, 71, 87, 0.3)',
                    color: 'var(--danger)',
                    fontSize: '14px',
                }}>
                    {error}
                </div>
            )}

            {result && (
                <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    borderRadius: '14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Your short URL
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <a
                            href={result.short_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent)' }}
                        >
                            {result.short_url}
                        </a>
                        <button
                            onClick={() => copyToClipboard(result.short_url)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: copied ? 'var(--success)' : 'transparent',
                                color: copied ? 'white' : 'var(--text-secondary)',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {copied ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        → {result.long_url}
                    </div>
                </div>
            )}
        </div>
    );
}
