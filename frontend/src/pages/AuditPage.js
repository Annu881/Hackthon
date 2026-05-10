import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AuditPage() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ decision: '', actorEmail: '', page: 1, limit: 20 });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
            const [logsRes, statsRes] = await Promise.all([api.get(`/audit?${params}`), api.get('/audit/stats')]);
            setLogs(logsRes.data.logs);
            setStats(statsRes.data.stats);
        } catch (e) { }
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, [filters]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Audit Logs</h1>
                    <p className="page-subtitle">Complete record of all authorization decisions</p>
                </div>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid-4 mb-4">
                    {[
                        { label: 'Total Requests', value: stats.total, color: 'var(--accent)' },
                        { label: 'Allowed', value: stats.allowed, color: 'var(--success)' },
                        { label: 'Denied', value: stats.denied, color: 'var(--danger)' },
                        { label: 'Allow Rate', value: stats.total ? `${Math.round((stats.allowed / stats.total) * 100)}%` : '0%', color: 'var(--warning)' },
                    ].map(s => (
                        <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <select value={filters.decision} onChange={e => setFilters({ ...filters, decision: e.target.value, page: 1 })} style={{ maxWidth: 150 }}>
                    <option value="">All Decisions</option>
                    <option value="allow">Allow</option>
                    <option value="deny">Deny</option>
                </select>
                <input placeholder="Filter by actor email..." value={filters.actorEmail}
                    onChange={e => setFilters({ ...filters, actorEmail: e.target.value, page: 1 })}
                    style={{ maxWidth: 260 }} />
                <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ decision: '', actorEmail: '', page: 1, limit: 20 })}>
                    Clear Filters
                </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div className="table-wrap">
                    {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Actor</th>
                                    <th>Action</th>
                                    <th>Resource</th>
                                    <th>Matched Policy</th>
                                    <th>Condition</th>
                                    <th>Decision</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log._id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: 11, color: 'var(--text3)' }}>
                                            {new Date(log.timestamp).toLocaleString('en-IN')}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 12, color: 'var(--text)' }}>{log.actor?.email}</div>
                                            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                                                {log.actor?.role && <span className={`badge badge-${log.actor.role}`} style={{ fontSize: 10, padding: '1px 5px' }}>{log.actor.role}</span>}
                                                {log.actor?.department && <span className="tag" style={{ fontSize: 10, padding: '1px 5px' }}>{log.actor.department}</span>}
                                            </div>
                                        </td>
                                        <td><span className="tag">{log.action}</span></td>
                                        <td>
                                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.resource?.uon}>
                                                {log.resource?.uon}
                                            </div>
                                            {log.resource?.domain && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{log.resource.domain}</div>}
                                        </td>
                                        <td>
                                            {log.matchedPolicy
                                                ? <span style={{ fontSize: 12, color: 'var(--accent)' }}>{log.matchedPolicy}</span>
                                                : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                                        </td>
                                        <td>
                                            {log.conditionEvaluated ? (
                                                <div>
                                                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.conditionEvaluated}</div>
                                                    <span style={{ fontSize: 10, color: log.conditionResult ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                                        {log.conditionResult ? '→ true' : '→ false'}
                                                    </span>
                                                </div>
                                            ) : <span style={{ color: 'var(--text3)', fontSize: 11 }}>N/A</span>}
                                        </td>
                                        <td><span className={`badge badge-${log.decision}`}>{log.decision}</span></td>
                                    </tr>
                                ))}
                                {!logs.length && <tr><td colSpan={7} className="empty-state">No audit logs yet. Make some access checks!</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Page {filters.page}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>← Prev</button>
                        <button className="btn btn-ghost btn-sm" disabled={logs.length < filters.limit} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next →</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
