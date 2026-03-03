const API_URL_SVC = process.env.NEXT_PUBLIC_URL_API || 'http://localhost:8081';
const API_ANALYTICS = process.env.NEXT_PUBLIC_ANALYTICS_API || 'http://localhost:8083';
const API_QR = process.env.NEXT_PUBLIC_QR_API || 'http://localhost:8085';

export interface Link {
    id: string;
    short_code: string;
    short_url: string;
    long_url: string;
    expires_at?: string;
    created_at: string;
}

export interface AnalyticsSummary {
    short_code: string;
    total_clicks: number;
    unique_visitors: number;
    top_countries: { country: string; clicks: number }[];
    top_browsers: { browser: string; clicks: number }[];
}

export interface TimeseriesPoint {
    period: string;
    clicks: number;
}

export async function createLink(longUrl: string, alias?: string): Promise<Link> {
    const res = await fetch(`${API_URL_SVC}/api/v1/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ long_url: longUrl, ...(alias ? { alias } : {}) }),
    });
    if (!res.ok) throw new Error('Failed to create link');
    return res.json();
}

export async function getAnalyticsSummary(shortCode: string): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_ANALYTICS}/api/v1/analytics/${shortCode}/summary`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
}

export async function getTimeseries(shortCode: string, granularity: 'hour' | 'day' = 'day'): Promise<TimeseriesPoint[]> {
    const res = await fetch(`${API_ANALYTICS}/api/v1/analytics/${shortCode}/timeseries?granularity=${granularity}`);
    if (!res.ok) throw new Error('Failed to fetch timeseries');
    const data = await res.json();
    return data.data || [];
}

export async function generateQR(shortCode: string): Promise<{ qr_url: string }> {
    const res = await fetch(`${API_QR}/api/v1/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_code: shortCode, size: 10, border: 4 }),
    });
    if (!res.ok) throw new Error('Failed to generate QR');
    return res.json();
}
