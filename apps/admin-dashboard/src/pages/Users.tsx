import { useEffect, useState } from 'react';
import { fetchUsers, createUser, type User } from '../lib/api';

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ email: '', name: '', password: '' });

    useEffect(() => {
        const load = () => {
            setLoading(true);
            fetchUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
        };
        load();
    }, []);

    const load = () => {
        setLoading(true);
        fetchUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createUser(form.email, form.name, form.password);
            setForm({ email: '', name: '', password: '' });
            setShowForm(false);
            load();
        } catch (err) { console.error(err); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">{users.length} registered users</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New User'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="inline-form">
                    <input placeholder="Email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <input placeholder="Password" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
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
                                <th>Email</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No users yet</td></tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.email}</td>
                                        <td>{u.name || '—'}</td>
                                        <td><span className="code-badge">{u.role}</span></td>
                                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
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
