import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS, LOCATIONS, ROLES, cap } from '../utils/constants';

export default function UsersPage() {
    const { user: me } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({});
    const [customRole, setCustomRole] = useState('');
    const [showCustomRole, setShowCustomRole] = useState(false);
    const [customDept, setCustomDept] = useState('');
    const [showCustomDept, setShowCustomDept] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const fetch = async () => {
        setLoading(true);
        const r = await api.get('/users');
        setUsers(r.data.users);
        setLoading(false);
    };

    useEffect(() => { fetch(); }, []);

    const openEdit = (u) => {
        setSelected(u);
        setForm({ ...u, groups: (u.groups || []).join(', ') });
        // If role not in standard list, show custom
        const isCustomRole = !ROLES.includes(u.role);
        setShowCustomRole(isCustomRole);
        setCustomRole(isCustomRole ? u.role : '');
        // If dept not in standard list, show custom
        const isCustomDept = !DEPARTMENTS.includes(u.department);
        setShowCustomDept(isCustomDept);
        setCustomDept(isCustomDept ? u.department : '');
        setModal('edit');
    };

    const handleRoleChange = (e) => {
        const val = e.target.value;
        if (val === '__custom__') {
            setShowCustomRole(true);
            setForm({ ...form, role: '' });
        } else {
            setShowCustomRole(false);
            setForm({ ...form, role: val });
        }
    };

    const handleDeptChange = (e) => {
        const val = e.target.value;
        if (val === '__custom__') {
            setShowCustomDept(true);
            setForm({ ...form, department: '' });
        } else {
            setShowCustomDept(false);
            setForm({ ...form, department: val });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalRole = showCustomRole ? customRole.trim().toLowerCase() : form.role;
            const finalDept = showCustomDept ? customDept.trim().toLowerCase() : form.department;
            const payload = {
                ...form,
                role: finalRole,
                department: finalDept,
                groups: form.groups ? form.groups.split(',').map(g => g.trim()).filter(Boolean) : []
            };
            await api.put(`/users/${selected._id}`, payload);
            await fetch(); setModal(null);
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        await api.delete(`/users/${id}`); fetch();
    };

    const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">Manage user identities, roles, and attributes</p>
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
            </div>

            {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div> : (
                <div className="card" style={{ padding: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Location</th>
                                <th>Groups</th>
                                <th>Employee ID</th>
                                <th>Status</th>
                                {me?.role === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{u.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                                    </td>
                                    <td><span className={`badge badge-${['admin', 'manager', 'analyst', 'developer', 'viewer'].includes(u.role) ? u.role : 'viewer'}`}>{u.role}</span></td>
                                    <td><span className="tag">{u.department}</span></td>
                                    <td style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase' }}>{u.location}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {(u.groups || []).slice(0, 2).map(g => <span key={g} className="tag" style={{ fontSize: 10 }}>{g}</span>)}
                                            {u.groups?.length > 2 && <span className="tag" style={{ fontSize: 10 }}>+{u.groups.length - 2}</span>}
                                        </div>
                                    </td>
                                    <td><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{u.employeeId}</span></td>
                                    <td><span className={`badge badge-${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                                    {me?.role === 'admin' && (
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                                                {u._id !== me._id && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(u._id)}>Del</button>}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal === 'edit' && selected && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Edit User: {selected.name}</h2>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '20px 24px' }}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <select value={form.location || 'india'} onChange={e => setForm({ ...form, location: e.target.value })}>
                                        {LOCATIONS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Role with custom option */}
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select value={showCustomRole ? '__custom__' : (form.role || 'viewer')} onChange={handleRoleChange}>
                                    {ROLES.map(r => <option key={r} value={r}>{cap(r)}</option>)}
                                    <option value="__custom__">+ Custom role...</option>
                                </select>
                                {showCustomRole && (
                                    <input
                                        placeholder="e.g. doctor, nurse, seller, auditor..."
                                        value={customRole}
                                        onChange={e => { setCustomRole(e.target.value); }}
                                        style={{ marginTop: 6 }}
                                    />
                                )}
                                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                                    Used as <span style={{ fontFamily: 'var(--mono)' }}>actor.role</span> in ABAC policy conditions
                                </div>
                            </div>

                            {/* Department with custom option */}
                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <select value={showCustomDept ? '__custom__' : (form.department || 'general')} onChange={handleDeptChange}>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{cap(d)}</option>)}
                                    <option value="__custom__">+ Custom department...</option>
                                </select>
                                {showCustomDept && (
                                    <input
                                        placeholder="e.g. cardiology, oncology, neurology..."
                                        value={customDept}
                                        onChange={e => { setCustomDept(e.target.value); }}
                                        style={{ marginTop: 6 }}
                                    />
                                )}
                                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                                    Used as <span style={{ fontFamily: 'var(--mono)' }}>actor.department</span> in ABAC policy conditions
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Groups (comma separated)</label>
                                <input placeholder="engineering-leads, querybuilder-development" value={form.groups || ''} onChange={e => setForm({ ...form, groups: e.target.value })} />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Active</label>
                                <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
