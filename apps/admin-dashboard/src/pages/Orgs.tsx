import { useEffect, useState } from 'react';
import { fetchOrgs, createOrg, type Org } from '../lib/api';

export default function Orgs() {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '' });

    const load = () => {
        setLoading(true);
        fetchOrgs().then(setOrgs).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createOrg(form.name, form.slug);
            setForm({ name: '', slug: '' });
            setShowForm(false);
            load();
        } catch (err) { console.error(err); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Organizations</h1>
                    <p className="page-subtitle">{orgs.length} organizations</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Org'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="inline-form">
                    <input placeholder="Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <input placeholder="Slug" required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                    <button type="submit" className="btn-primary">Create</button>
                </form>
            )}

            {loading ? (
                <div className="page-loading">Loading...</div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Plan</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgs.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No organizations yet</td></tr>
                            ) : (
                                orgs.map((o) => (
                                    <tr key={o.id}>
                                        <td style={{ fontWeight: 500 }}>{o.name}</td>
                                        <td><code className="code-badge">{o.slug}</code></td>
                                        <td><span className={`status-badge status-${o.plan}`}>{o.plan}</span></td>
                                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
