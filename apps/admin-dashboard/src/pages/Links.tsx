import { useEffect, useState } from 'react';
import { fetchLinks, deleteLink, type AdminLink } from '../lib/api';

export default function Links() {
    const [links, setLinks] = useState<AdminLink[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const pageSize = 10;

    useEffect(() => {
        const load = () => {
            setLoading(true);
            fetchLinks(page, pageSize)
                .then((d) => { setLinks(d.links || []); setTotal(d.total || 0); })
                .catch(console.error)
                .finally(() => setLoading(false));
        };
        load();
    }, [page, pageSize]);

    const load = () => {
        setLoading(true);
        fetchLinks(page, pageSize)
            .then((d) => { setLinks(d.links || []); setTotal(d.total || 0); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this link?')) return;
        try {
            await deleteLink(id);
            load();
        } catch (e) { console.error(e); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Links</h1>
                    <p className="page-subtitle">{total} total links</p>
                </div>
            </div>

            {loading ? (
                <div className="page-loading">Loading...</div>
            ) : (
                <>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Short Code</th>
                                    <th>Long URL</th>
                                    <th>Status</th>
                                    <th>Clicks</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {links.map((l) => (
                                    <tr key={l.id}>
                                        <td><code className="code-badge">{l.short_code}</code></td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <a href={l.long_url} target="_blank" rel="noopener" style={{ color: '#888' }}>{l.long_url}</a>
                                        </td>
                                        <td><span className={`status-badge status-${l.status}`}>{l.status}</span></td>
                                        <td>{Number(l.click_count).toLocaleString()}</td>
                                        <td>{new Date(l.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn-danger-sm" onClick={() => handleDelete(l.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost">← Prev</button>
                        <span style={{ fontSize: '13px', color: '#888' }}>Page {page} of {Math.ceil(total / pageSize) || 1}</span>
                        <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)} className="btn-ghost">Next →</button>
                    </div>
                </>
            )}
        </div>
    );
}
