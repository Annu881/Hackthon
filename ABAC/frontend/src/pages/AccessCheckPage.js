import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EXAMPLES = [
    { label: 'Read Sales Report', resourceUon: 'uon://reports/production/report/sales', action: 'read', ctx: {} },
    { label: 'Payment RPC (India)', resourceUon: 'uon://service-payment/production/rpc/payment/processPayment', action: 'read', ctx: {} },
    { label: 'Kafka Subscribe', resourceUon: 'uon://topics.kafka/production/topic/analytics-events', action: 'subscribe', ctx: {} },
    { label: 'Delete User DB', resourceUon: 'uon://orders.mysql.storage/production/table/users', action: 'delete', ctx: {} },
    { label: 'Admin Dashboard', resourceUon: 'uon://service-admin/production/rpc/admin/dashboard', action: 'read', ctx: {} },
];

export default function AccessCheckPage() {
    const { user } = useAuth();
    const [form, setForm] = useState({ resourceUon: '', action: 'read', context: '{}' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    // Simulate mode (admin only)
    const [simMode, setSimMode] = useState(false);
    const [users, setUsers] = useState([]);
    const [simActor, setSimActor] = useState('');

    // JIT Request Modal
    const [showReqModal, setShowReqModal] = useState(false);
    const [reqForm, setReqForm] = useState({ reason: '', duration: 2 });
    const [reqLoading, setReqLoading] = useState(false);
    const [reqSuccess, setReqSuccess] = useState(false);

    useEffect(() => {
        if (['admin', 'manager'].includes(user?.role)) {
            api.get('/users').then(r => setUsers(r.data.users));
        }
        // Clear stale results when user or role changes
        setResult(null);
        setHistory([]);
    }, [user]);

    const handleCheck = async () => {
        if (!form.resourceUon || !form.action) return;
        setLoading(true);
        try {
            let ctx = {};
            try { ctx = JSON.parse(form.context || '{}'); } catch (e) { }

            let r;
            if (simMode && simActor) {
                r = await api.post('/access/simulate', { actorId: simActor, resourceUon: form.resourceUon, action: form.action, context: ctx });
            } else {
                r = await api.post('/access/check', { resourceUon: form.resourceUon, action: form.action, context: ctx });
            }
            const res = r.data;
            setResult(res);
            setHistory(prev => [{ ...res, resourceUon: form.resourceUon, action: form.action, time: new Date() }, ...prev.slice(0, 9)]);
        } catch (err) {
            setResult({ error: err.response?.data?.message || 'Check failed' });
        } finally { setLoading(false); }
    };

    const handleRequestAccess = async () => {
        setReqLoading(true);
        try {
            await api.post('/requests', {
                resourceUon: form.resourceUon,
                action: form.action,
                reason: reqForm.reason,
                requestedDuration: reqForm.duration
            });
            setReqSuccess(true);
            setTimeout(() => {
                setShowReqModal(false);
                setReqSuccess(false);
                setReqForm({ reason: '', duration: 2 });
            }, 2000);
        } catch (err) {
            alert('Request failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setReqLoading(false);
        }
    };

    const loadExample = (ex) => setForm({ resourceUon: ex.resourceUon, action: ex.action, context: JSON.stringify(ex.ctx) });

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Access Check</h1>
                    <p className="page-subtitle">Evaluate ABAC authorization decisions in real-time</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Left - Form */}
                <div>
                    {/* Current Actor */}
                    <div className="card" style={{ marginBottom: 16, borderColor: 'var(--border2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Actor Identity</div>
                            {['admin', 'manager'].includes(user?.role) && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={simMode} onChange={e => setSimMode(e.target.checked)} style={{ width: 'auto' }} />
                                    Simulate as other user
                                </label>
                            )}
                        </div>

                        {!simMode ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                {[
                                    { k: 'Email', v: user?.email },
                                    { k: 'Role', v: user?.role },
                                    { k: 'Department', v: user?.department },
                                    { k: 'Location', v: user?.location },
                                    { k: 'Groups', v: (user?.groups || []).join(', ') || '—' },
                                    { k: 'Employee ID', v: user?.employeeId },
                                ].map(item => (
                                    <div key={item.k} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{item.k}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, wordBreak: 'break-all' }}>{item.v || '—'}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Simulate as User</label>
                                <select value={simActor} onChange={e => setSimActor(e.target.value)}>
                                    <option value="">Select a user to simulate...</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.role} — {u.department})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Request Form */}
                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Authorization Request</div>

                        {/* Quick examples */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Quick Examples</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {EXAMPLES.map(ex => (
                                    <button key={ex.label} className="btn btn-ghost btn-sm" onClick={() => loadExample(ex)}>{ex.label}</button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Resource UON *</label>
                            <input placeholder="uon://domain/environment/type/id" value={form.resourceUon}
                                onChange={e => setForm({ ...form, resourceUon: e.target.value })}
                                style={{ fontFamily: 'var(--mono)', fontSize: 12 }} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Action *</label>
                            <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
                                {['read', 'create', 'update', 'delete', 'publish', 'subscribe', 'admin', 'execute'].map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Context (JSON, optional)</label>
                            <textarea rows={3} placeholder='{"actorAttributes": {}, "resourceAttributes": {}}' value={form.context}
                                onChange={e => setForm({ ...form, context: e.target.value })}
                                style={{ fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }} />
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                            onClick={handleCheck} disabled={loading || !form.resourceUon}>
                            {loading ? 'Evaluating...' : '⬢ Evaluate Access'}
                        </button>
                    </div>
                </div>

                {/* Right - Results */}
                <div>
                    {/* Decision Result */}
                    {result && (
                        <div style={{
                            marginBottom: 16,
                            borderColor: result.error ? 'var(--danger)' : result.allowed ? 'var(--success)' : 'var(--danger)',
                            borderWidth: 2
                        }}>
                            {result.error ? (
                                <div style={{ color: 'var(--danger)', fontSize: 14 }}>Error: {result.error}</div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{
                                            width: 56, height: 56, borderRadius: '50%',
                                            background: result.allowed ? 'rgba(34,211,160,0.15)' : 'rgba(255,79,109,0.15)',
                                            border: `2px solid ${result.allowed ? 'var(--success)' : 'var(--danger)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 24
                                        }}>
                                            {result.allowed ? '✓' : '✗'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: result.allowed ? 'var(--success)' : 'var(--danger)' }}>
                                                {result.allowed ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{result.reason}</div>
                                        </div>
                                    </div>

                                    {!result.allowed && !simMode && (
                                        <div style={{ marginBottom: 16, padding: 12, background: 'rgba(255,181,71,0.05)', border: '1px dashed var(--warning)', borderRadius: 8 }}>
                                            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Need temporary access? Submit a Just-In-Time (JIT) request to an admin.</div>
                                            <button className="btn btn-warning btn-sm" style={{ width: '100%' }} onClick={() => setShowReqModal(true)}>
                                                📥 Request Temporary Access
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                        {[
                                            { label: 'Matched Policy', value: result.matchedPolicy || '—', color: 'var(--accent)' },
                                            { label: 'Domain', value: result.policyDomain || '—', color: 'var(--text2)' },
                                            { label: 'Effect', value: result.effect || '—', color: result.effect === 'allow' ? 'var(--success)' : 'var(--danger)' },
                                            { label: 'Condition', value: result.conditionResult !== null && result.conditionResult !== undefined ? String(result.conditionResult) : 'N/A', color: 'var(--warning)' },
                                        ].map(item => (
                                            <div key={item.label} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{item.label}</div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: item.color, fontFamily: 'var(--mono)' }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Logic Tree */}
                                    {result.evaluationSteps && result.evaluationSteps.length > 0 && (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Evaluation Logic Trace</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {result.evaluationSteps.map((step, si) => (
                                                    <div key={si} style={{ paddingLeft: 12, borderLeft: `2px solid ${step.actorMatch !== false && step.resourceMatch !== false && step.conditionResult !== false ? 'var(--success)' : 'var(--danger)'}`, position: 'relative' }}>
                                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                                                            {step.policyName} <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>· P:{step.priority}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                            {step.step === 'Actor Matching' && (
                                                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: step.actorMatch ? 'rgba(34,211,160,0.1)' : 'rgba(255,79,109,0.1)', color: step.actorMatch ? 'var(--success)' : 'var(--danger)', border: `1px solid ${step.actorMatch ? 'var(--success)' : 'var(--danger)'}` }}>
                                                                    Actor: {step.actorMatch ? 'MATCH' : 'MISMATCH'}
                                                                </span>
                                                            )}
                                                            {step.step === 'Permission Matching' && (
                                                                <>
                                                                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: step.resourceMatch ? 'rgba(34,211,160,0.1)' : 'rgba(255,79,109,0.1)', color: step.resourceMatch ? 'var(--success)' : 'var(--danger)', border: `1px solid ${step.resourceMatch ? 'var(--success)' : 'var(--danger)'}` }}>
                                                                        Resource: {step.resourceMatch ? 'MATCH' : 'MISMATCH'}
                                                                    </span>
                                                                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: step.actionMatch ? 'rgba(34,211,160,0.1)' : 'rgba(255,79,109,0.1)', color: step.actionMatch ? 'var(--success)' : 'var(--danger)', border: `1px solid ${step.actionMatch ? 'var(--success)' : 'var(--danger)'}` }}>
                                                                        Action: {step.actionMatch ? 'MATCH' : 'MISMATCH'}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {step.step === 'Condition Evaluation' && (
                                                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: step.conditionResult ? 'rgba(34,211,160,0.1)' : 'rgba(255,79,109,0.1)', color: step.conditionResult ? 'var(--success)' : 'var(--danger)', border: `1px solid ${step.conditionResult ? 'var(--success)' : 'var(--danger)'}` }}>
                                                                    Condition: {step.conditionResult ? 'TRUE' : 'FALSE'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {!result && (
                        <div className="card" style={{ marginBottom: 16, textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border)' }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>⬢</div>
                            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Fill in the form and click Evaluate Access</div>
                            <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>The ABAC engine will evaluate all active policies</div>
                        </div>
                    )}

                    {/* History */}
                    {history.length > 0 && (
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>Recent Evaluations</div>
                            {history.map((h, i) => (
                                <div key={i} style={{ padding: '10px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ fontSize: 16, color: h.allowed ? 'var(--success)' : 'var(--danger)' }}>{h.allowed ? '✓' : '✗'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.resourceUon}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{h.action} · {h.matchedPolicy || 'no policy'}</div>
                                    </div>
                                    <span style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{h.time?.toLocaleTimeString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* JIT Request Modal */}
            {showReqModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 450, position: 'relative' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--warning)' }}>Request Access</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
                            Target: <code style={{ color: 'var(--accent)' }}>{form.resourceUon}</code>
                        </div>

                        {reqSuccess ? (
                            <div style={{ padding: '24px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: 32, color: 'var(--success)', marginBottom: 12 }}>✓</div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>Request Submitted!</div>
                                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>An admin will review your request shortly.</div>
                            </div>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Reason for access</label>
                                    <textarea rows={3} placeholder="Please explain why you need regular access..." value={reqForm.reason}
                                        onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration (Hours)</label>
                                    <select value={reqForm.duration} onChange={e => setReqForm({ ...reqForm, duration: e.target.value })}>
                                        <option value={1}>1 Hour</option>
                                        <option value={2}>2 Hours</option>
                                        <option value={4}>4 Hours</option>
                                        <option value={8}>8 Hours</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReqModal(false)} disabled={reqLoading}>Cancel</button>
                                    <button className="btn btn-warning" style={{ flex: 1 }} onClick={handleRequestAccess} disabled={reqLoading || !reqForm.reason}>
                                        {reqLoading ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
