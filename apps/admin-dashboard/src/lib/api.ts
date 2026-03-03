// Admin Dashboard API client — calls proxied via Vite dev server

export interface Stats {
    total_links: number;
    total_users: number;
    total_orgs: number;
    total_clicks: number;
}

export interface AdminLink {
    id: string;
    short_code: string;
    long_url: string;
    org_id: string | null;
    status: string;
    click_count: string;
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    org_id: string | null;
    created_at: string;
}

export interface Org {
    id: string;
    name: string;
    slug: string;
    plan: string;
    owner_id: string | null;
    created_at: string;
}

// ── Admin Stats ──────────────────────────────────────────
export async function fetchStats(): Promise<Stats> {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

// ── Admin Links ──────────────────────────────────────────
export async function fetchLinks(page = 1, pageSize = 20): Promise<{ links: AdminLink[]; total: number }> {
    const res = await fetch(`/api/admin/links?page=${page}&page_size=${pageSize}`);
    if (!res.ok) throw new Error('Failed to fetch links');
    return res.json();
}

export async function deleteLink(id: string): Promise<void> {
    const res = await fetch(`/api/admin/links/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete link');
}

// ── Users ────────────────────────────────────────────────
export async function fetchUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.users || data || [];
}

export async function createUser(email: string, name: string, password: string): Promise<User> {
    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
}

// ── Orgs ─────────────────────────────────────────────────
export async function fetchOrgs(): Promise<Org[]> {
    const res = await fetch('/api/orgs');
    if (!res.ok) throw new Error('Failed to fetch orgs');
    const data = await res.json();
    return data.orgs || data || [];
}

export async function createOrg(name: string, slug: string): Promise<Org> {
    const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
    });
    if (!res.ok) throw new Error('Failed to create org');
    return res.json();
}
