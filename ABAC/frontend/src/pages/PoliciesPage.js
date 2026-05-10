import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ACTIONS = ['create', 'read', 'update', 'delete', 'publish', 'subscribe', 'admin', 'execute'];

const emptyPolicy = {
    name: '', description: '', domain: '',
    actorMatcher: { type: 'role', value: '' },
    permissions: [{ resourceMatcher: '', actions: [], condition: { expression: '', description: '' }, effect: 'allow' }],
    priority: 0, tags: '', isActive: true
};

export default function PoliciesPage() {
    const { user } = useAuth();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'view'
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyPolicy);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const canEdit = ['admin', 'manager'].includes(user?.role);

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const r = await api.get('/policies');
            setPolicies(r.data.policies);
        } catch (e) { } finally { setLoading(false); }
    };

    useEffect(() => { fetchPolicies(); }, []);

    const openCreate = () => { setForm(emptyPolicy); setError(''); setModal('create'); };
    const openEdit = (p) => {
        setSelected(p);
        setForm({ ...p, tags: (p.tags || []).join(', '), permissions: p.permissions.map(perm => ({ ...perm, condition: perm.condition || { expression: '', description: '' } })) });
        setError(''); setModal('edit');
    };
    const openView = (p) => { setSelected(p); setModal('view'); };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
            // Clean empty conditions
            payload.permissions = payload.permissions.map(p => ({ ...p, condition: p.condition?.expression ? p.condition : null }));
            if (modal === 'create') await api.post('/policies', payload);
            else await api.put(`/policies/${selected._id}`, payload);
            await fetchPolicies();
            setModal(null);
        } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (id) => {
        await api.patch(`/policies/${id}/toggle`);
        fetchPolicies();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this policy?')) return;
        await api.delete(`/policies/${id}`);
        fetchPolicies();
    };

    const updatePermission = (i, field, value) => {
        const perms = [...form.permissions];
        perms[i] = { ...perms[i], [field]: value };
        setForm({ ...form, permissions: perms });
    };

    const updateCondition = (i, field, value) => {
        const perms = [...form.permissions];
        perms[i] = { ...perms[i], condition: { ...perms[i].condition, [field]: value } };
        setForm({ ...form, permissions: perms });
    };

    const addPermission = () => setForm({ ...form, permissions: [...form.permissions, { resourceMatcher: '', actions: [], condition: { expression: '', description: '' }, effect: 'allow' }] });
    const removePermission = (i) => setForm({ ...form, permissions: form.permissions.filter((_, idx) => idx !== i) });

    const filtered = policies.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.domain.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Policies</h1>
                    <p className="page-subtitle">Manage ABAC authorization policies (Actor → Action → Resource)</p>
                </div>
                {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ New Policy</button>}
            </div>

            <div style={{ marginBottom: 16 }}>
                <input placeholder="Search policies by name or domain..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
            </div>

            {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div> : (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Policy Name</th>
                                    <th>Domain</th>
                                    <th>Actor Matcher</th>
                                    <th>Permissions</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p._id}>
                                        <td>
                                            <div style={{ color: 'var(--text)', fontWeight: 500 }}>{p.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{p.description?.slice(0, 60)}{p.description?.length > 60 ? '…' : ''}</div>
                                        </td>
                                        <td><span className="tag">{p.domain}</span></td>
                                        <td>
                                            <div style={{ fontSize: 12 }}>
                                                <span style={{ color: 'var(--text3)' }}>{p.actorMatcher.type}: </span>
                                                <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{p.actorMatcher.value || '*'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {p.permissions.map((perm, i) => (
                                                <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>
                                                    <span style={{ color: perm.effect === 'allow' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{perm.effect.toUpperCase()} </span>
                                                    <span style={{ color: 'var(--text2)' }}>{perm.actions.join(', ')}</span>
                                                    {perm.condition?.expression && <span style={{ color: 'var(--warning)', marginLeft: 4 }}>⚡ condition</span>}
                                                </div>
                                            ))}
                                        </td>
                                        <td><span style={{ fontFamily: 'var(--mono)', color: 'var(--warning)' }}>{p.priority}</span></td>
                                        <td>
                                            <span className={`badge badge-${p.isActive ? 'active' : 'inactive'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openView(p)}>View</button>
                                                {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>}
                                                {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(p._id)} style={{ color: p.isActive ? 'var(--danger)' : 'var(--success)' }}>
                                                    {p.isActive ? 'Disable' : 'Enable'}
                                                </button>}
                                                {user?.role === 'admin' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p._id)}>Del</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!filtered.length && <tr><td colSpan={7} className="empty-state">No policies found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {modal && modal !== 'view' && (
                <Modal title={modal === 'create' ? 'Create Policy' : 'Edit Policy'} onClose={() => setModal(null)} onSave={handleSave} saving={saving} error={error}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Policy Name *</label>
                            <input placeholder="e.g. Engineering Read Reports" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Domain *</label>
                            <input placeholder="e.g. reports, topics.kafka" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input placeholder="What does this policy do?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Actor Type</label>
                            <select value={form.actorMatcher.type} onChange={e => setForm({ ...form, actorMatcher: { ...form.actorMatcher, type: e.target.value } })}>
                                {['role', 'user', 'group', 'service', 'any'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        {form.actorMatcher.type !== 'any' && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Actor Value</label>
                                <input placeholder={form.actorMatcher.type === 'role' ? 'admin, manager, analyst...' : 'user ID / group name'} value={form.actorMatcher.value} onChange={e => setForm({ ...form, actorMatcher: { ...form.actorMatcher, value: e.target.value } })} />
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Priority</label>
                            <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Tags (comma separated)</label>
                            <input placeholder="kafka, ownership, deny" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                        </div>
                    </div>

                    {/* Permissions */}
                    <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <label className="form-label" style={{ margin: 0 }}>Permissions</label>
                            <button className="btn btn-ghost btn-sm" onClick={addPermission}>+ Add Permission</button>
                        </div>
                        {form.permissions.map((perm, i) => (
                            <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Permission {i + 1}</span>
                                    {form.permissions.length > 1 && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '2px 8px' }} onClick={() => removePermission(i)}>× Remove</button>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Resource Matcher (UON Pattern)</label>
                                    <input placeholder="uon://reports/production/report/*" value={perm.resourceMatcher} onChange={e => updatePermission(i, 'resourceMatcher', e.target.value)} style={{ fontFamily: 'var(--mono)', fontSize: 12 }} />
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Effect</label>
                                        <select value={perm.effect} onChange={e => updatePermission(i, 'effect', e.target.value)}>
                                            <option value="allow">Allow</option>
                                            <option value="deny">Deny</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Actions</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {ACTIONS.map(a => (
                                                <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: perm.actions.includes(a) ? 'var(--accent)' : 'var(--text2)' }}>
                                                    <input type="checkbox" checked={perm.actions.includes(a)}
                                                        onChange={e => updatePermission(i, 'actions', e.target.checked ? [...perm.actions, a] : perm.actions.filter(x => x !== a))}
                                                        style={{ width: 'auto', marginRight: 2 }} />
                                                    {a}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">ABAC Condition Expression (optional)</label>
                                    <input placeholder='e.g. actor.department == "engineering" && actor.location == "india"'
                                        value={perm.condition?.expression || ''} onChange={e => updateCondition(i, 'expression', e.target.value)}
                                        style={{ fontFamily: 'var(--mono)', fontSize: 12 }} />
                                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                                        Supported: actor.role, actor.department, actor.location, actor.groups, resource.type, resource.sensitivity, resource.domain
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal>
            )}

            {/* View Modal */}
            {modal === 'view' && selected && (
                <Modal title={selected.name} onClose={() => setModal(null)} viewOnly>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                        <span className={`badge badge-${selected.isActive ? 'active' : 'inactive'}`}>{selected.isActive ? 'Active' : 'Inactive'}</span>
                        <span className="tag">Priority: {selected.priority}</span>
                        <span className="tag">Domain: {selected.domain}</span>
                        {(selected.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{selected.description}</p>
                    <div style={{ marginBottom: 16 }}>
                        <div className="form-label">Actor Matcher</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', background: 'var(--bg2)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                            {selected.actorMatcher.type}: {selected.actorMatcher.value || '*'}
                        </div>
                    </div>
                    <div className="form-label">Permissions</div>
                    {selected.permissions.map((perm, i) => (
                        <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                <span className={`badge badge-${perm.effect}`}>{perm.effect}</span>
                                {perm.actions.map(a => <span key={a} className="tag">{a}</span>)}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{perm.resourceMatcher}</div>
                            {perm.condition?.expression && (
                                <div style={{ background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.2)', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--warning)' }}>
                                    ⚡ {perm.condition.expression}
                                </div>
                            )}
                        </div>
                    ))}
                </Modal>
            )}
        </div>
    );
}

function Modal({ title, children, onClose, onSave, saving, error, viewOnly }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                    {error && <div style={{ background: 'rgba(255,79,109,0.1)', border: '1px solid rgba(255,79,109,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>{error}</div>}
                    {children}
                </div>
                {!viewOnly && (
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Policy'}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
