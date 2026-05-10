import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, sub, color }) => (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'var(--mono)' }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
);

const COLORS = ['var(--success)', 'var(--danger)', 'var(--accent)', 'var(--warning)'];

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/stats').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div>;

    const s = stats?.stats || {};
    const activityData = (stats?.recentLogs || []).slice(0, 8).map((log, i) => ({
        name: log.actor?.email?.split('@')[0] || 'unknown',
        allow: log.decision === 'allow' ? 1 : 0,
        deny: log.decision === 'deny' ? 1 : 0,
    }));

    const pieData = [
        { name: 'Allowed', value: s.allowed || 0 },
        { name: 'Denied', value: s.denied || 0 },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Charter Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.name} · Role: <span className={`badge badge-${user?.role}`}>{user?.role}</span></p>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>
                    <div>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div style={{ color: 'var(--success)', marginTop: 2 }}>● System Operational</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid-5 mb-4">
                <StatCard label="Total Users" value={s.users || 0} sub="Active identities" color="var(--accent)" />
                <StatCard label="Active Policies" value={s.activePolicies || 0} sub={`of ${s.policies || 0} total`} color="var(--warning)" />
                <StatCard label="Resources" value={s.resources || 0} sub="Protected assets" color="var(--success)" />
                <StatCard label="Total Requests" value={s.totalRequests || 0} sub="Authorization decisions" color="var(--text2)" />
                <div className="card" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.healthScore > 80 ? 'var(--success)' : 'var(--warning)', fontFamily: 'var(--mono)' }}>{s.healthScore || 0}%</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>Security Health</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>System integrity</div>
                </div>
            </div>

            {s.pendingJit > 0 && (
                <div className="card" style={{ marginBottom: 16, background: 'rgba(255,181,71,0.1)', border: '1px solid var(--warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>🔔</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>
                            Attention: {s.pendingJit} Access Requests are pending Admin review!
                        </div>
                    </div>
                    <a href="/requests" className="btn btn-sm" style={{ background: 'var(--warning)', color: '#000' }}>Review Now</a>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Access Decision Breakdown */}
                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Access Decisions</h3>
                    <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Allow vs Deny overview</p>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--mono)' }}>{s.allowed || 0}</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)' }}>ALLOWED</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', fontFamily: 'var(--mono)' }}>{s.denied || 0}</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)' }}>DENIED</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={activityData}>
                            <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }} />
                            <Bar dataKey="allow" fill="var(--success)" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="deny" fill="var(--danger)" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Resource Heatmap (TOP DENIED) */}
                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🚨 Threat Heatmap</h3>
                    <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Top 5 resources with most denials</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(stats?.deniedHeatmap || []).map((item, i) => (
                            <div key={i} style={{ fontSize: 11 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{item._id.split('/').pop()}</span>
                                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{item.count}</span>
                                </div>
                                <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--danger)', width: `${Math.min((item.count / (s.denied || 1)) * 100, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                        {!stats?.deniedHeatmap?.length && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 12 }}>No violations detected.</div>}
                    </div>
                </div>

                {/* Pie */}
                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Decision Ratio</h3>
                    <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Overall distribution</p>
                    <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                                {pieData.map((entry, index) => <Cell key={index} fill={index === 0 ? 'var(--success)' : 'var(--danger)'} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4 }}>
                        {pieData.map((p, i) => (
                            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? 'var(--success)' : 'var(--danger)' }} />
                                <span style={{ color: 'var(--text3)' }}>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Logs */}
            <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Authorization Requests</h3>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Resource</th>
                                <th>Policy Matched</th>
                                <th>Decision</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats?.recentLogs || []).map(log => (
                                <tr key={log._id}>
                                    <td>
                                        <div style={{ fontSize: 13, color: 'var(--text)' }}>{log.actor?.email}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{log.actor?.role}</div>
                                    </td>
                                    <td><span className="tag">{log.action}</span></td>
                                    <td><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{log.resource?.uon?.slice(0, 40)}{log.resource?.uon?.length > 40 ? '…' : ''}</span></td>
                                    <td><span style={{ fontSize: 12, color: 'var(--accent)' }}>{log.matchedPolicy || '—'}</span></td>
                                    <td><span className={`badge badge-${log.decision}`}>{log.decision}</span></td>
                                    <td style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {!stats?.recentLogs?.length && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>No authorization requests yet. Try the Access Check page.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
