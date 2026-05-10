import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CachePage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [flushing, setFlushing] = useState(false);
    const [msg, setMsg] = useState('');
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const r = await api.get('/cache/stats');
            setStats(r.data.cache);
        } catch (e) {
            setStats({ available: false, message: 'Could not fetch cache stats' });
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchStats(); }, []);

    const flushCache = async () => {
        setFlushing(true); setMsg('');
        try {
            const r = await api.delete('/cache/flush');
            setMsg(r.data.message);
            setTimeout(fetchStats, 500);
        } catch (e) {
            setMsg('Flush failed: ' + (e.response?.data?.message || e.message));
        } finally { setFlushing(false); }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Cache & Performance</h1>
                    <p className="page-subtitle">Redis caching status — Authorization latency &lt; 50ms</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchStats}>Refresh</button>
            </div>

            {/* How it works */}
            <div className="card" style={{ marginBottom: 16, background: 'rgba(79,142,255,0.04)', borderColor: 'rgba(79,142,255,0.25)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, color: 'var(--accent)' }}>⚡</span>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>How Redis Caching Works</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
                            Without cache: Every access check → MongoDB query → fetch all policies → evaluate<br />
                            With Redis cache: Every access check → Redis hit (microseconds) → evaluate — <strong style={{ color: 'var(--success)' }}>10x faster!</strong><br />
                            Cache is automatically invalidated when any policy is created, updated, or deleted.
                        </div>
                    </div>
                </div>

                {/* Flow diagram */}
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
                    {[
                        { label: 'Access Check Request', color: 'var(--accent)' },
                        { label: '→' },
                        { label: 'Redis Cache?', color: 'var(--warning)' },
                        { label: '→ HIT →' },
                        { label: 'Evaluate Policies', color: 'var(--success)' },
                        { label: '→' },
                        { label: 'Allow / Deny', color: 'var(--text)' },
                    ].map((item, i) => item.label.includes('→') ? (
                        <span key={i} style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{item.label}</span>
                    ) : (
                        <span key={i} style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: item.color || 'var(--text2)', fontWeight: 500 }}>{item.label}</span>
                    ))}
                </div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, paddingLeft: 120 }}>
                    <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>→ MISS →</span>
                    <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--danger)' }}>MongoDB Query</span>
                    <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>→</span>
                    <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--warning)' }}>Store in Redis</span>
                    <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>→</span>
                    <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--success)' }}>Evaluate</span>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div>
            ) : (
                <>
                    {/* Redis Status */}
                    <div className="grid-2" style={{ marginBottom: 16 }}>
                        <div className="card" style={{ borderLeft: `3px solid ${stats?.available ? 'var(--success)' : 'var(--danger)'}` }}>
                            <div style={{ display: 'flex', align: 'center', gap: 10, marginBottom: 10 }}>
                                <span style={{ fontSize: 24 }}>{stats?.available ? '✅' : '❌'}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 15, color: stats?.available ? 'var(--success)' : 'var(--danger)' }}>
                                        Redis {stats?.available ? 'Connected' : 'Not Connected'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{stats?.message}</div>
                                </div>
                            </div>
                            {!stats?.available && (
                                <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', border: '1px solid var(--border)' }}>
                                    System is working normally using MongoDB directly.<br />
                                    Install Redis to enable caching: <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>sudo apt install redis-server</span>
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <div className="form-label">Success Metrics</div>
                            {[
                                { label: 'Target Latency', value: '< 50ms', status: 'var(--accent)' },
                                { label: 'Policy Accuracy', value: '≥ 95%', status: 'var(--success)' },
                                { label: 'System Uptime', value: '≥ 99%', status: 'var(--success)' },
                                { label: 'Error Rate', value: '< 1%', status: 'var(--success)' },
                            ].map(m => (
                                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                                    <span style={{ color: 'var(--text2)' }}>{m.label}</span>
                                    <span style={{ fontFamily: 'var(--mono)', color: m.status, fontWeight: 600 }}>{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cache Stats */}
                    {stats?.available && (
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Cache Statistics</div>
                                {user?.role === 'admin' && (
                                    <button className="btn btn-danger btn-sm" onClick={flushCache} disabled={flushing}>
                                        {flushing ? 'Flushing...' : '🗑️ Flush Policy Cache'}
                                    </button>
                                )}
                            </div>

                            {msg && (
                                <div style={{ background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: 'var(--success)' }}>
                                    {msg}
                                </div>
                            )}

                            <div className="grid-4">
                                {[
                                    { label: 'Cache Hits', value: stats.hits || 0, color: 'var(--success)' },
                                    { label: 'Cache Misses', value: stats.misses || 0, color: 'var(--danger)' },
                                    { label: 'Hit Rate', value: stats.hitRate || '0%', color: 'var(--accent)' },
                                    { label: 'TTL', value: stats.ttl || '300s', color: 'var(--warning)' },
                                ].map(s => (
                                    <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '14px 16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Time policies info */}
                    <div className="card" style={{ borderColor: 'rgba(255,181,71,0.3)', background: 'rgba(255,181,71,0.04)' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--warning)', marginBottom: 10 }}>⏰ Time-Based Policies</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 12 }}>
                            Environment attributes automatically injected by ABAC engine at evaluation time:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                            {[
                                { key: 'env.hour', val: `${now.getHours()} / 23  (24h format — 12 ke baad 13, 14...)` },
                                { key: 'env.minute', val: `${now.getMinutes()} (0–59)` },
                                { key: 'env.dayOfWeek', val: `${now.getDay()} (0=Sun, 1=Mon ... 6=Sat)` },
                                { key: 'env.isWeekend', val: String(now.getDay() === 0 || now.getDay() === 6) },
                                { key: 'env.isWorkingHours', val: `${String(now.getHours() >= 9 && now.getHours() < 18)}  (9–18 = working hours)` },
                                { key: 'env.time (UTC)', val: now.toISOString().slice(0, 19).replace('T', ' ') },
                                { key: 'env.time (Local)', val: now.toLocaleString() },
                            ].map(e => (
                                <div key={e.key} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px' }}>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warning)', marginBottom: 3 }}>{e.key}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{e.val}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>
                            Example conditions to use in policies:
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginTop: 6, color: 'var(--accent)', lineHeight: 1.8 }}>
                            env.hour &gt;= 9 &amp;&amp; env.hour &lt;= 18{'  '}← Working hours only{'\n'}
                            env.isWeekend == false{'              '}← Block weekends{'\n'}
                            env.isWorkingHours == true{'          '}← Business hours shortcut{'\n'}
                            env.dayOfWeek &gt;= 1 &amp;&amp; env.dayOfWeek &lt;= 5{'  '}← Mon–Fri only
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
