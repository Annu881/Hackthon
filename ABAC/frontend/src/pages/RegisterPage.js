import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS, LOCATIONS, ROLES, cap } from '../utils/constants';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', department: 'general', location: 'india', role: 'viewer' });
    const [customDept, setCustomDept] = useState('');
    const [showCustomDept, setShowCustomDept] = useState(false);
    const [customRole, setCustomRole] = useState('');
    const [showCustomRole, setShowCustomRole] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const dept = showCustomDept ? customDept.trim().toLowerCase() : form.department;
            const role = showCustomRole ? customRole.trim().toLowerCase() : form.role;
            if (!dept) { setError('Department required'); setLoading(false); return; }
            if (!role) { setError('Role required'); setLoading(false); return; }
            await register({ ...form, department: dept, role });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally { setLoading(false); }
    };

    const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) });

    const currentRole = showCustomRole ? customRole : form.role;
    const currentDept = showCustomDept ? customDept : form.department;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 480 }}>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: 'var(--accent)', letterSpacing: 4, marginBottom: 8 }}>ABAC</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Create Account</div>
                </div>

                <div className="card">
                    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Register</h2>

                    {error && (
                        <div style={{ background: 'rgba(255,79,109,0.1)', border: '1px solid rgba(255,79,109,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input placeholder="Dr. Sharma" {...f('name')} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" placeholder="you@company.com" {...f('email')} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" placeholder="Min 6 characters" {...f('password')} required />
                        </div>

                        {/* Department */}
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <select value={showCustomDept ? '__custom__' : form.department} onChange={handleDeptChange}>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{cap(d)}</option>)}
                                <option value="__custom__">+ Custom department...</option>
                            </select>
                            {showCustomDept && (
                                <input
                                    placeholder="e.g. cardiology, neurology, oncology..."
                                    value={customDept}
                                    onChange={e => { setCustomDept(e.target.value); setForm({ ...form, department: e.target.value.toLowerCase() }); }}
                                    style={{ marginTop: 6 }}
                                    required
                                />
                            )}
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                                Used as <span style={{ fontFamily: 'var(--mono)' }}>actor.department</span> in ABAC policies
                            </div>
                        </div>

                        {/* Role */}
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select value={showCustomRole ? '__custom__' : form.role} onChange={handleRoleChange}>
                                {ROLES.map(r => <option key={r} value={r}>{cap(r)}</option>)}
                                <option value="__custom__">+ Custom role...</option>
                            </select>
                            {showCustomRole && (
                                <input
                                    placeholder="e.g. doctor, nurse, seller, auditor..."
                                    value={customRole}
                                    onChange={e => { setCustomRole(e.target.value); setForm({ ...form, role: e.target.value.toLowerCase() }); }}
                                    style={{ marginTop: 6 }}
                                    required
                                />
                            )}
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                                Used as <span style={{ fontFamily: 'var(--mono)' }}>actor.role</span> in ABAC policies
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <select {...f('location')}>
                                {LOCATIONS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                            </select>
                        </div>

                        {/* Dynamic hint */}
                        {(currentRole || currentDept) && (
                            <div style={{ background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: 'var(--text2)' }}>
                                💡 Policy condition example for this user:<br />
                                <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', marginTop: 4, display: 'block' }}>
                                    {currentRole && currentDept
                                        ? `actor.role == "${currentRole}" && actor.department == "${currentDept}"`
                                        : currentRole
                                            ? `actor.role == "${currentRole}"`
                                            : `actor.department == "${currentDept}"`}
                                </span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }} disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account →'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
                    Already registered? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
