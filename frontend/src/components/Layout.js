import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const navItems = [
    { path: '/dashboard', icon: '◈', label: 'Dashboard' },
    { path: '/policies', icon: '⊚', label: 'Policies' },
    { path: '/resources', icon: '◉', label: 'Resources' },
    { path: '/access-check', icon: '⦿', label: 'Access Check' },
    { path: '/attributes', icon: '◇', label: 'Attribute Stores' },
    { path: '/audit', icon: '◎', label: 'Audit Logs' },
    { path: '/requests', icon: '⌬', label: 'Access Requests', adminOnly: true, badge: true },
    { path: '/cache', icon: '⌁', label: 'Cache & Perf' },
    { path: '/users', icon: '◐', label: 'Users', adminOnly: true },
    { path: '/profile', icon: '○', label: 'My Profile' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (user?.role === 'admin') {
            const fetchCount = () => {
                api.get('/requests/pending-count').then(r => setPendingCount(r.data.count)).catch(() => { });
            };
            fetchCount();
            const interval = setInterval(fetchCount, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleLogout = () => { logout(); navigate('/login'); };
    const visibleItems = navItems.filter(item => !item.adminOnly || ['admin', 'manager'].includes(user?.role));

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
            <aside style={{
                width: collapsed ? 64 : 240, background: 'var(--bg2)',
                borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                transition: 'width 0.2s', overflow: 'hidden', position: 'fixed',
                top: 0, left: 0, bottom: 0, zIndex: 100
            }}>
                <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {!collapsed && (
                        <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: 2 }}>ABAC</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase' }}>Access Control</div>
                        </div>
                    )}
                    {collapsed && <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>A</div>}
                    <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 14, cursor: 'pointer', padding: 4 }}>
                        {collapsed ? '▶' : '◀'}
                    </button>
                </div>

                <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
                    {visibleItems.map(item => (
                        <NavLink key={item.path} to={item.path} className="nav-link-item" style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 6, marginBottom: 2,
                            color: isActive ? 'var(--accent)' : 'var(--text2)',
                            background: isActive ? 'var(--accent-glow)' : 'transparent',
                            fontWeight: isActive ? 500 : 400, fontSize: 13,
                            transition: 'all 0.15s', textDecoration: 'none',
                            whiteSpace: 'nowrap', overflow: 'hidden', position: 'relative'
                        })}>
                            <span className="nav-icon" style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                            {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                            {item.badge && pendingCount > 0 && !collapsed && (
                                <span style={{
                                    background: 'var(--danger)', color: '#fff', fontSize: 10,
                                    fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                                    boxShadow: '0 0 10px rgba(255,79,109,0.3)'
                                }}>
                                    {pendingCount}
                                </span>
                            )}
                            {item.badge && pendingCount > 0 && collapsed && (
                                <div style={{
                                    position: 'absolute', top: 8, right: 8, width: 8, height: 8,
                                    borderRadius: '50%', background: 'var(--danger)',
                                    boxShadow: '0 0 10px rgba(255,79,109,0.5)'
                                }} />
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
                    {!collapsed && (
                        <div style={{ padding: '10px 12px', marginBottom: 4, background: 'var(--surface)', borderRadius: 6 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                                <span className={`badge badge-${user?.role}`} style={{ fontSize: 10, padding: '1px 6px' }}>{user?.role}</span>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '9px 12px', borderRadius: 6, background: 'none',
                        border: 'none', color: 'var(--danger)', fontSize: 13, cursor: 'pointer',
                        transition: 'background 0.15s'
                    }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,79,109,0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                        <span style={{ fontSize: 16 }}>⏻</span>
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            <main style={{
                flex: 1,
                marginLeft: collapsed ? 64 : 240,
                transition: 'margin-left 0.2s',
                minHeight: '100vh',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

