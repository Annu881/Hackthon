import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AttributesPage() {
    const { user } = useAuth();
    const [stores, setStores] = useState([]);
    const [allAttrs, setAllAttrs] = useState([]);
    const [expr, setExpr] = useState('');
    const [validating, setValidating] = useState(false);
    const [validResult, setValidResult] = useState(null);

    useEffect(() => {
        api.get('/attributes/stores').then(r => setStores(r.data.stores));
        api.get('/attributes/supported').then(r => setAllAttrs(r.data.attributes));
    }, []);

    const validateExpr = async () => {
        if (!expr) return;
        setValidating(true); setValidResult(null);
        try {
            const r = await api.post('/attributes/validate-expression', { expression: expr });
            setValidResult(r.data);
        } catch (e) { setValidResult({ valid: false, message: 'Validation failed' }); }
        finally { setValidating(false); }
    };

    const exampleExprs = [
        'actor.department == "engineering"',
        'actor.location == "india" && actor.role == "manager"',
        'resource.sensitivity == "internal" || actor.role == "admin"',
        'actor.department == resource.domain',
        '"engineering-leads" in actor.groups',
    ];

    const storeColors = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--text2)'];
    const storeIcons = ['◐', '◉', '◈', '○'];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attribute Stores</h1>
                    <p className="page-subtitle">Policy Information Points (PIPs) — sources of attribute values at authorization runtime</p>
                </div>
            </div>

            {/* Architecture explanation */}
            <div className="card" style={{ marginBottom: 20, background: 'rgba(79,142,255,0.05)', borderColor: 'rgba(79,142,255,0.3)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 24, color: 'var(--accent)' }}>⬡</span>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>How Attribute-Based Access Control Works</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
                            When a policy has a <span style={{ color: 'var(--warning)', fontFamily: 'var(--mono)' }}>condition</span> expression, the ABAC engine fetches attribute values from these stores at runtime.
                            The expression is then evaluated using those values to produce a boolean (allow/deny) result.
                            This enables dynamic, context-aware access decisions beyond simple role-based checks.
                        </div>
                    </div>
                </div>
            </div>

            {/* Attribute Stores */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
                {stores.map((store, i) => (
                    <div key={store.id} className="card" style={{ borderLeft: `3px solid ${storeColors[i % storeColors.length]}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <span style={{ fontSize: 22, color: storeColors[i % storeColors.length] }}>{storeIcons[i % storeIcons.length]}</span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{store.name}</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{store.id}</div>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>{store.description}</p>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Supported Attributes</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {store.supportedAttributes.map(attr => (
                                    <span key={attr} className="tag" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: storeColors[i % storeColors.length] }}>
                                        {attr}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Expression Validator */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Expression Validator</div>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Test CEL-like condition expressions before using them in policies</p>

                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Example Expressions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {exampleExprs.map(e => (
                            <button key={e} className="btn btn-ghost btn-sm" onClick={() => setExpr(e)} style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                                {e.length > 40 ? e.slice(0, 40) + '…' : e}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <input placeholder='e.g. actor.department == "engineering" && actor.location == "india"' value={expr}
                        onChange={e => setExpr(e.target.value)}
                        style={{ fontFamily: 'var(--mono)', fontSize: 13, flex: 1 }} />
                    <button className="btn btn-primary" onClick={validateExpr} disabled={validating || !expr}>{validating ? '...' : 'Validate'}</button>
                </div>

                {validResult && (
                    <div style={{
                        marginTop: 12, padding: '10px 14px', borderRadius: 6,
                        background: validResult.valid ? 'rgba(34,211,160,0.08)' : 'rgba(255,79,109,0.08)',
                        border: `1px solid ${validResult.valid ? 'rgba(34,211,160,0.3)' : 'rgba(255,79,109,0.3)'}`,
                        fontSize: 13, color: validResult.valid ? 'var(--success)' : 'var(--danger)',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}>
                        <span>{validResult.valid ? '✓' : '✗'}</span>
                        <span>{validResult.message}</span>
                    </div>
                )}
            </div>

            {/* All Supported Attributes Reference */}
            <div className="card">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>All Supported Attributes Reference</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                    {allAttrs.map(attr => {
                        const [prefix] = attr.split('.');
                        const color = prefix === 'actor' ? 'var(--accent)' : prefix === 'resource' ? 'var(--success)' : 'var(--warning)';
                        return (
                            <div key={attr} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>{attr}</span>
                            </div>
                        );
                    })}
                </div>
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Operators Supported</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {['==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', 'in [...]'].map(op => (
                            <span key={op} className="tag" style={{ fontFamily: 'var(--mono)', color: 'var(--warning)' }}>{op}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
