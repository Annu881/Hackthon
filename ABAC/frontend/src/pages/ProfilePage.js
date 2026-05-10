import React, { useState } from 'react';
import { DEPARTMENTS, LOCATIONS, cap } from '../utils/constants';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', location: user?.location || '', groups: (user?.groups || []).join(', ') });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setMsg('');
        try {
            await api.put('/users/me/profile', { ...form, groups: form.groups.split(',').map(g => g.trim()).filter(Boolean) });
            await refreshUser();
            setMsg('Profile updated successfully!');
        } catch (err) { setMsg('Update failed: ' + (err.response?.data?.message || err.message)); }
        finally { setSaving(false); }
    };

    const spiffeId = `spiffe://personnel.upki.ca/eid/${user?.employeeId || ''}`;

    return (
        <div style={{ maxWidth: 700 }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Your identity attributes used in ABAC policy evaluation</p>
                </div>
            </div>

            {/* Identity Card */}
            <div className="card" style={{ marginBottom: 20, borderColor: 'var(--border2)' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-glow)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--accent)', flexShrink: 0 }}>
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{user?.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{user?.email}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                            <span className="tag">{user?.department}</span>
                            <span className="tag">{user?.location?.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>SPIFFE Actor ID</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', background: 'var(--bg)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', wordBreak: 'break-all' }}>
                        {spiffeId}
                    </div>
                </div>
            </div>

            {/* ABAC Attributes */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Your ABAC Attributes</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {[
                        { label: 'actor.role', value: user?.role },
                        { label: 'actor.department', value: user?.department },
                        { label: 'actor.location', value: user?.location },
                        { label: 'actor.employeeId', value: user?.employeeId },
                        { label: 'actor.groups', value: (user?.groups || []).join(', ') || '—' },
                    ].map(attr => (
                        <div key={attr.label} style={{ background: 'var(--bg)', borderRadius: 6, padding: '10px 12px', border: '1px solid var(--border)' }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', marginBottom: 4 }}>{attr.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', wordBreak: 'break-word' }}>{attr.value || '—'}</div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(79,142,255,0.05)', borderRadius: 6, border: '1px solid rgba(79,142,255,0.2)', fontSize: 12, color: 'var(--text2)' }}>
                    💡 These attributes are evaluated against policy conditions to determine your access rights.
                </div>
            </div>

            {/* Edit Form */}
            <div className="card">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Update Profile</div>
                {msg && (
                    <div style={{ background: msg.includes('success') ? 'rgba(34,211,160,0.1)' : 'rgba(255,79,109,0.1)', border: `1px solid ${msg.includes('success') ? 'rgba(34,211,160,0.3)' : 'rgba(255,79,109,0.3)'}`, borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: msg.includes('success') ? 'var(--success)' : 'var(--danger)' }}>
                        {msg}
                    </div>
                )}
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
                                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Groups (comma separated)</label>
                        <input placeholder="engineering-leads, querybuilder-development" value={form.groups} onChange={e => setForm({ ...form, groups: e.target.value })} />
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Groups are used as actor.groups in policy conditions</div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </form>
            </div>
        </div>
    );
}
