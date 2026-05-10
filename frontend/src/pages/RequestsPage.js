import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RequestsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const r = await api.get('/requests');
            setRequests(r.data);
        } catch (err) {
            setError('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, status) => {
        try {
            await api.patch(`/requests/${id}`, { status });
            fetchRequests();
        } catch (err) {
            alert('Action failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return { color: 'var(--success)', background: 'rgba(34,211,160,0.1)' };
            case 'denied': return { color: 'var(--danger)', background: 'rgba(255,79,109,0.1)' };
            default: return { color: 'var(--warning)', background: 'rgba(255,181,71,0.1)' };
        }
    };

    if (loading && requests.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Access Requests</h1>
                    <p className="page-subtitle">Manage Just-In-Time (JIT) access requests</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchRequests}>Refresh</button>
            </div>

            {error && <div className="card" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>User & Reason</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>Target Resource</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>Duration</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>Status</th>
                            {user?.role === 'admin' && <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>No access requests found</td></tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{req.actorEmail}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>"{req.reason}"</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>{req.action}</div>
                                        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text2)', marginTop: 4 }}>{req.resourceUon}</div>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: 13 }}>
                                        {req.requestedDuration} Hours
                                        {req.expiresAt && (
                                            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                                                Expires: {new Date(req.expiresAt).toLocaleString()}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                            ...getStatusStyle(req.status)
                                        }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            {req.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleAction(req._id, 'approved')}>Approve</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleAction(req._id, 'denied')}>Deny</button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Processed</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
