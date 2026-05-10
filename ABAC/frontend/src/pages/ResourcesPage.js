import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyResource = { name: '', uon: '', type: 'endpoint', domain: '', environment: 'production', sensitivity: 'internal', description: '', attributes: '' };

export default function ResourcesPage() {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyResource);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const canEdit = ['admin', 'manager'].includes(user?.role);

    const fetch = async () => {
        setLoading(true);
        const r = await api.get('/resources');
        setResources(r.data.resources);
        setLoading(false);
    };

    useEffect(() => { fetch(); }, []);

    const openCreate = () => { setForm(emptyResource); setError(''); setModal('create'); };
    const openEdit = (r) => {
        setSelected(r);
        const attrs = r.attributes ? Object.entries(r.attributes).map(([k, v]) => `${k}=${v}`).join('\n') : '';
        setForm({ ...r, attributes: attrs });
        setError(''); setModal('edit');
    };

    const parseAttributes = (str) => {
        if (!str) return {};
        const map = {};
        str.split('\n').forEach(line => {
            const [k, ...v] = line.split('=');
            if (k && v) map[k.trim()] = v.join('=').trim();
        });
        return map;
    };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            const payload = { ...form, attributes: parseAttributes(form.attributes) };
            if (modal === 'create') await api.post('/resources', payload);
            else await api.put(`/resources/${selected._id}`, payload);
            await fetch(); setModal(null);
        } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this resource?')) return;
        await api.delete(`/resources/${id}`); fetch();
    };

    const filtered = resources.filter(r => {
        const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.uon.toLowerCase().includes(search.toLowerCase());
        const matchType = !typeFilter || r.type === typeFilter;
        return matchSearch && matchType;
    });

    const typeIcon = { endpoint: '⬡', database: '◉', report: '◈', kafka_topic: '⬢', document: '◆', service: '○', dataset: '◎' };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Resources</h1>
                    <p className="page-subtitle">Protected assets identified by UON (Uber Object Name)</p>
                </div>
                {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ New Resource</button>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input placeholder="Search by name or UON..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ maxWidth: 180 }}>
                    <option value="">All Types</option>
                    {['endpoint', 'database', 'report', 'kafka_topic', 'document', 'service', 'dataset'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {filtered.map(r => (
                        <div key={r._id} className="card" style={{ borderTop: `2px solid var(--accent)` }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 20, color: 'var(--accent)' }}>{typeIcon[r.type] || '○'}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.environment}</div>
                                    </div>
                                </div>
                                <span className={`badge badge-${r.sensitivity}`}>{r.sensitivity}</span>
                            </div>

                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--bg)', padding: '6px 10px', borderRadius: 5, marginBottom: 10, wordBreak: 'break-all' }}>
                                {r.uon}
                            </div>

                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                <span className="tag">{r.type}</span>
                                <span className="tag">{r.domain}</span>
                                {r.attributes && Object.entries(r.attributes).slice(0, 2).map(([k, v]) => (
                                    <span key={k} className="tag" style={{ color: 'var(--warning)' }}>{k}: {v}</span>
                                ))}
                            </div>

                            {r.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>{r.description}</p>}

                            {canEdit && (
                                <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
                                    {user?.role === 'admin' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r._id)}>Delete</button>}
                                </div>
                            )}
                        </div>
                    ))}
                    {!filtered.length && <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="empty-icon">◉</div>No resources found</div>}
                </div>
            )}

            {modal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{modal === 'create' ? 'New Resource' : 'Edit Resource'}</h2>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                            {error && <div style={{ background: 'rgba(255,79,109,0.1)', border: '1px solid rgba(255,79,109,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>{error}</div>}
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input placeholder="Sales Report API" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type *</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        {['endpoint', 'database', 'report', 'kafka_topic', 'document', 'service', 'dataset'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">UON (Uber Object Name) *</label>
                                <input placeholder="uon://domain/production/type/id" value={form.uon} onChange={e => setForm({ ...form, uon: e.target.value })} style={{ fontFamily: 'var(--mono)', fontSize: 12 }} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Domain</label>
                                    <input placeholder="reports, topics.kafka, service-foo" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Environment</label>
                                    <select value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}>
                                        {['production', 'staging', 'development'].map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sensitivity</label>
                                <select value={form.sensitivity} onChange={e => setForm({ ...form, sensitivity: e.target.value })}>
                                    {['public', 'internal', 'confidential', 'restricted'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input placeholder="What does this resource represent?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Attributes (key=value, one per line)</label>
                                <textarea rows={4} placeholder={"region=india\ncategory=sales\npii=false"} value={form.attributes} onChange={e => setForm({ ...form, attributes: e.target.value })} style={{ fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }} />
                                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>These attributes are used in ABAC condition expressions</div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Resource'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
