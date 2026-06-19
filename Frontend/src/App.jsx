import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  User, Activity, CheckCircle, Building2, RefreshCw,
  Shield, Eye, EyeOff, LogOut, Wifi, WifiOff, AlertCircle,
  Zap, ChevronRight
} from 'lucide-react';

const API_BASE_URL = '/api/v1';
let AUTH_TOKEN = localStorage.getItem('unified_token') || '';

const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('unified_token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('unified_token');
    AUTH_TOKEN = '';
    window.location.reload();
  }
  return Promise.reject(err);
});

const PROVIDER_COLORS = {
  hubspot:    { bg: 'rgba(255,122,0,0.18)',  text: '#ff8c42', border: 'rgba(255,122,0,0.35)' },
  salesforce: { bg: 'rgba(0,161,224,0.18)',  text: '#29b6e8', border: 'rgba(0,161,224,0.35)' },
  pipedrive:  { bg: 'rgba(38,184,96,0.18)',  text: '#2ed573', border: 'rgba(38,184,96,0.35)' },
  mock:       { bg: 'rgba(139,92,246,0.18)', text: '#a78bfa', border: 'rgba(139,92,246,0.35)' },
};

function ProviderBadge({ provider }) {
  const c = PROVIDER_COLORS[provider] || PROVIDER_COLORS.mock;
  return (
    <span style={{
      padding: '3px 12px', borderRadius: '20px', fontSize: '0.71rem',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      textTransform: 'capitalize', fontWeight: '600', letterSpacing: '0.02em',
    }}>{provider}</span>
  );
}

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} aria-label={show ? 'Hide password' : 'Show password'}
      style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        color: '#8b949e', display: 'flex', alignItems: 'center', borderRadius: '4px',
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#58a6ff'}
      onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
    >
      {show
        ? <EyeOff size={17} />
        : <Eye size={17} />
      }
    </button>
  );
}

export default function App() {
  const [contacts,     setContacts]    = useState([]);
  const [companies,    setCompanies]   = useState([]);
  const [providers,    setProviders]   = useState([]);
  const [loading,      setLoading]     = useState(false);
  const [fetchError,   setFetchError]  = useState('');
  const [activeTab,    setActiveTab]   = useState('contacts');
  const [isLoggedIn,   setIsLoggedIn]  = useState(!!AUTH_TOKEN);
  const [registering,  setRegistering] = useState(false);
  const [showPwd,      setShowPwd]     = useState(false);
  const [loginForm,    setLoginForm]   = useState({ email: '', password: '' });
  const [loginError,   setLoginError]  = useState('');
  const [loginLoading, setLoginLoading]= useState(false);
  const [backendDown,  setBackendDown] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      if (activeTab === 'contacts') {
        const r = await api.get('/contacts?limit=20');
        setContacts(r.data?.data?.data || []);
      } else if (activeTab === 'companies') {
        const r = await api.get('/companies?limit=20');
        setCompanies(r.data?.data?.data || []);
      } else {
        const r = await api.get('/providers');
        setProviders(r.data?.data || []);
      }
      setBackendDown(false);
    } catch (err) {
      if (!err.response) {
        setBackendDown(true);
        setFetchError('Backend server is not reachable. Run: cd backend && npm run dev');
      } else {
        setFetchError(err.response?.data?.message || `Error ${err.response?.status}: Something went wrong.`);
      }
    } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn, activeTab, fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError(''); setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', loginForm);
      const token = res.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('No token');
      AUTH_TOKEN = token;
      localStorage.setItem('unified_token', token);
      setIsLoggedIn(true);
    } catch (err) {
      if (!err.response) setLoginError('⚠️ Backend not running. Start: cd backend && npm run dev');
      else if (err.response?.status === 401) setLoginError('❌ Wrong email or password. Try: admin@unifiedcrm.io / Password123');
      else setLoginError('❌ ' + (err.response?.data?.message || 'Login failed. Try again.'));
    } finally { setLoginLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoginError(''); setLoginLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: loginForm.email.split('@')[0] || 'User',
        email: loginForm.email, password: loginForm.password, organizationName: 'My Org',
      });
      const token = res.data?.data?.tokens?.accessToken;
      if (!token) throw new Error('No token');
      AUTH_TOKEN = token;
      localStorage.setItem('unified_token', token);
      setIsLoggedIn(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.join(' · ');
      setLoginError('❌ ' + (msg || 'Registration failed. Password needs 8+ chars, 1 uppercase, 1 number.'));
    } finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    AUTH_TOKEN = '';
    localStorage.removeItem('unified_token');
    setIsLoggedIn(false);
    setContacts([]); setCompanies([]); setProviders([]);
  };

  // ─────────────────────────────────────────────────────
  // LOGIN PAGE
  // ─────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 20% 20%, #0d1b2e 0%, #0d1117 50%, #0a0e14 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: '20px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow orbs */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(31,111,235,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', margin: '0 auto 20px',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 40px rgba(31,111,235,0.4)',
            }}>🔗</div>
            <h1 style={{
              color: '#f0f6ff', fontSize: '1.75rem', fontWeight: '800',
              margin: 0, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #e6edf3 0%, #8b949e 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Unified CRM API
            </h1>
            <p style={{ color: '#484f58', marginTop: '8px', fontSize: '0.88rem' }}>
              {registering ? 'Create your account to get started' : 'Sign in to manage your integrations'}
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(22,27,34,0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(48,54,61,0.8)',
            borderRadius: '16px', padding: '32px',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.6)',
          }}>
            <form onSubmit={registering ? handleRegister : handleLogin}>
              {/* Email */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ color: '#8b949e', fontSize: '0.82rem', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Email
                </label>
                <input id="login-email" type="email" placeholder="admin@unifiedcrm.io"
                  value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  required autoComplete="email"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)',
                    borderRadius: '10px', color: '#e6edf3', fontSize: '0.94rem',
                    boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#1f6feb'; e.target.style.boxShadow = '0 0 0 3px rgba(31,111,235,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(48,54,61,0.8)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Password + Eye Toggle */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ color: '#8b949e', fontSize: '0.82rem', fontWeight: '600', display: 'block', marginBottom: '8px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder={showPwd ? 'Password123' : '••••••••••'}
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    required autoComplete={registering ? 'new-password' : 'current-password'}
                    style={{
                      width: '100%', padding: '12px 44px 12px 16px',
                      background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)',
                      borderRadius: '10px', color: '#e6edf3', fontSize: '0.94rem',
                      boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#1f6feb'; e.target.style.boxShadow = '0 0 0 3px rgba(31,111,235,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(48,54,61,0.8)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <EyeToggle show={showPwd} onToggle={() => setShowPwd(p => !p)} />
                </div>
                {registering && (
                  <p style={{ color: '#484f58', fontSize: '0.73rem', marginTop: '7px' }}>
                    Min 8 chars · 1 uppercase letter · 1 number
                  </p>
                )}
              </div>

              {/* Error */}
              {loginError && (
                <div style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)',
                  marginBottom: '20px',
                }}>
                  <AlertCircle size={15} color="#f85149" style={{ marginTop: '1px', flexShrink: 0 }} />
                  <span style={{ color: '#f85149', fontSize: '0.83rem', lineHeight: '1.5' }}>{loginError}</span>
                </div>
              )}

              {/* Submit */}
              <button id="auth-submit" type="submit" disabled={loginLoading} style={{
                width: '100%', padding: '13px',
                background: loginLoading ? 'rgba(33,38,45,0.8)' : 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
                border: 'none', borderRadius: '10px',
                color: loginLoading ? '#484f58' : 'white', fontSize: '0.95rem', fontWeight: '700',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s', letterSpacing: '0.01em',
                boxShadow: loginLoading ? 'none' : '0 4px 20px rgba(31,111,235,0.4)',
              }}>
                {loginLoading ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                  </svg> {registering ? 'Creating account…' : 'Signing in…'}</>
                ) : (
                  <><Shield size={16} /> {registering ? 'Create Account' : 'Sign In'}</>
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <span style={{ color: '#484f58', fontSize: '0.83rem' }}>
                {registering ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <span onClick={() => { setRegistering(r => !r); setLoginError(''); setShowPwd(false); }}
                style={{ color: '#58a6ff', fontSize: '0.83rem', cursor: 'pointer', fontWeight: '600' }}>
                {registering ? 'Sign in' : 'Register'}
              </span>
            </div>

            {/* Demo hint */}
            <div style={{
              marginTop: '20px', padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(31,111,235,0.06)', border: '1px solid rgba(31,111,235,0.15)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Zap size={13} color="#58a6ff" />
              <p style={{ color: '#58a6ff', fontSize: '0.78rem', margin: 0 }}>
                <strong>Demo:</strong> admin@unifiedcrm.io &nbsp;/&nbsp; Password123
              </p>
            </div>
          </div>

          <p style={{ color: '#30363d', fontSize: '0.73rem', textAlign: 'center', marginTop: '24px' }}>
            Unified CRM API v1.0 ·{' '}
            <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer"
              style={{ color: '#484f58', textDecoration: 'none' }}>API Docs</a>
          </p>
        </div>

        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // DASHBOARD — with proper separated Navbar
  // ─────────────────────────────────────────────────────
  const TABS = [
    { id: 'contacts',  label: 'Contacts',  icon: <User size={15} />,      count: contacts.length },
    { id: 'companies', label: 'Companies', icon: <Building2 size={15} />, count: companies.length },
    { id: 'providers', label: 'Providers', icon: <Activity size={15} />, count: providers.length },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 15% 10%, #0d1b2e 0%, #0d1117 50%, #0a0e14 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(31,111,235,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* ══════════════════════════════════════
          TOP NAVBAR — completely separate from content
         ══════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(48,54,61,0.6)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        {/* Left — Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
            boxShadow: '0 0 16px rgba(31,111,235,0.4)',
          }}>🔗</div>
          <div>
            <span style={{
              color: '#e6edf3', fontSize: '1rem', fontWeight: '700', letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #e6edf3, #8b949e)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Unified CRM
            </span>
            <span style={{
              marginLeft: '8px', padding: '2px 7px', borderRadius: '6px',
              background: 'rgba(31,111,235,0.15)', color: '#58a6ff',
              fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', border: '1px solid rgba(31,111,235,0.25)',
            }}>v1.0</span>
          </div>
        </div>

        {/* Center — Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: backendDown ? '#f85149' : '#3fb950',
            boxShadow: backendDown ? '0 0 8px rgba(248,81,73,0.6)' : '0 0 8px rgba(63,185,80,0.6)',
            animation: backendDown ? 'none' : 'pulse 2s infinite',
          }} />
          <span style={{ color: backendDown ? '#f85149' : '#3fb950', fontSize: '0.78rem', fontWeight: '600' }}>
            {backendDown ? 'Offline' : 'Live'}
          </span>
        </div>

        {/* Right — User info + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '6px 12px', borderRadius: '8px',
            background: 'rgba(33,38,45,0.8)', border: '1px solid rgba(48,54,61,0.6)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: 'white',
            }}>A</div>
            <span style={{ color: '#8b949e', fontSize: '0.82rem' }}>Admin</span>
          </div>

          <button id="logout-btn" onClick={handleLogout} style={{
            padding: '8px 16px', borderRadius: '8px',
            background: 'transparent', border: '1px solid rgba(248,81,73,0.2)',
            color: '#8b949e', fontSize: '0.82rem', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s', letterSpacing: '0.01em',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(248,81,73,0.08)';
              e.currentTarget.style.borderColor = 'rgba(248,81,73,0.4)';
              e.currentTarget.style.color = '#f85149';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(248,81,73,0.2)';
              e.currentTarget.style.color = '#8b949e';
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          PAGE CONTENT
         ══════════════════════════════════════ */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 60px' }}>

        {/* Hero Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
              background: 'rgba(31,111,235,0.12)', color: '#58a6ff',
              border: '1px solid rgba(31,111,235,0.25)', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Dashboard</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '800', margin: '0 0 10px',
            letterSpacing: '-0.04em', lineHeight: 1.15,
            background: 'linear-gradient(135deg, #e6edf3 0%, #c9d1d9 50%, #8b949e 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Unified API Dashboard
          </h1>
          <p style={{ color: '#484f58', fontSize: '0.95rem', margin: 0 }}>
            All your CRM data — HubSpot, Salesforce &amp; Pipedrive — normalized in one place.
          </p>
        </div>

        {/* Backend down banner */}
        {backendDown && (
          <div style={{
            marginBottom: '24px', padding: '14px 18px', borderRadius: '12px',
            background: 'rgba(248,81,73,0.07)', border: '1px solid rgba(248,81,73,0.25)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <WifiOff size={16} color="#f85149" />
            <span style={{ color: '#f85149', fontSize: '0.86rem', lineHeight: 1.5 }}>
              Backend is offline. Open a terminal in the <code style={{ background: 'rgba(248,81,73,0.1)', padding: '1px 6px', borderRadius: '4px' }}>backend/</code> folder and run&nbsp;
              <code style={{ background: 'rgba(248,81,73,0.1)', padding: '1px 6px', borderRadius: '4px' }}>npm run dev</code>
            </span>
          </div>
        )}

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap',
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                background: active
                  ? 'linear-gradient(135deg, #1f6feb, #8b5cf6)'
                  : 'rgba(33,38,45,0.7)',
                color: active ? 'white' : '#8b949e',
                fontWeight: active ? '700' : '500',
                fontSize: '0.88rem', letterSpacing: active ? '0.01em' : '0',
                transition: 'all 0.2s',
                boxShadow: active ? '0 4px 20px rgba(31,111,235,0.35), 0 0 0 1px rgba(255,255,255,0.08)' : '0 0 0 1px rgba(48,54,61,0.5)',
              }}>
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    padding: '1px 7px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '700',
                    background: active ? 'rgba(255,255,255,0.2)' : 'rgba(48,54,61,0.8)',
                    color: active ? 'white' : '#484f58',
                  }}>{tab.count}</span>
                )}
              </button>
            );
          })}

          <button id="refresh-btn" onClick={fetchData} disabled={loading} style={{
            marginLeft: 'auto', padding: '10px 18px', borderRadius: '10px',
            border: '1px solid rgba(48,54,61,0.6)', background: 'rgba(33,38,45,0.5)',
            color: loading ? '#484f58' : '#8b949e', cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem', fontWeight: '500',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = '#58a6ff'; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.6)'}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Main card */}
        <div style={{
          background: 'rgba(22,27,34,0.7)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(48,54,61,0.6)', borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 24px 80px rgba(0,0,0,0.5)',
        }}>
          {/* Card header */}
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid rgba(48,54,61,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(13,17,23,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(31,111,235,0.12)', border: '1px solid rgba(31,111,235,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {activeTab === 'contacts'  && <User size={17} color="#58a6ff" />}
                {activeTab === 'companies' && <Building2 size={17} color="#58a6ff" />}
                {activeTab === 'providers' && <Activity size={17} color="#58a6ff" />}
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#e6edf3', fontSize: '1rem', fontWeight: '700' }}>
                  {activeTab === 'contacts'  && 'Unified Contacts'}
                  {activeTab === 'companies' && 'Unified Companies'}
                  {activeTab === 'providers' && 'CRM Providers'}
                </h2>
                <p style={{ margin: 0, color: '#484f58', fontSize: '0.78rem', marginTop: '1px' }}>
                  Normalized from all connected CRM providers
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: backendDown ? '#f85149' : '#3fb950',
                boxShadow: backendDown ? 'none' : '0 0 8px rgba(63,185,80,0.7)',
                animation: backendDown ? 'none' : 'pulse 2s infinite',
              }} />
              <span style={{
                fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em',
                color: backendDown ? '#f85149' : '#3fb950',
              }}>
                {backendDown ? 'OFFLINE' : 'LIVE'}
              </span>
            </div>
          </div>

          {/* Table area */}
          <div style={{ minHeight: '240px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '14px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f6feb" strokeWidth="2.5"
                  style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                </svg>
                <span style={{ color: '#484f58', fontSize: '0.85rem' }}>Loading data…</span>
              </div>

            ) : fetchError ? (
              <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertCircle size={22} color="#f85149" />
                </div>
                <p style={{ color: '#8b949e', margin: 0, fontSize: '0.88rem', maxWidth: '360px', lineHeight: '1.6' }}>{fetchError}</p>
                <button onClick={fetchData} style={{
                  padding: '8px 20px', borderRadius: '8px',
                  border: '1px solid rgba(248,81,73,0.3)', background: 'transparent',
                  color: '#f85149', cursor: 'pointer', fontSize: '0.83rem', fontWeight: '600',
                }}>Try Again</button>
              </div>

            ) : activeTab === 'contacts' ? (
              contacts.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(13,17,23,0.4)' }}>
                      {['#', 'Name', 'Email', 'Phone', 'Job Title', 'Provider'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#484f58', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(48,54,61,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 20px', color: '#30363d', fontSize: '0.78rem' }}>{i + 1}</td>
                        <td style={{ padding: '14px 20px', color: '#e6edf3', fontWeight: '600', fontSize: '0.88rem' }}>{c.name || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.85rem' }}>{c.email || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.85rem' }}>{c.phone || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.85rem' }}>{c.jobTitle || '—'}</td>
                        <td style={{ padding: '14px 20px' }}><ProviderBadge provider={c.provider} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ padding: '48px', textAlign: 'center', color: '#484f58', fontSize: '0.88rem' }}>No contacts found.</div>

            ) : activeTab === 'companies' ? (
              companies.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(13,17,23,0.4)' }}>
                      {['#', 'Company', 'Website', 'Industry', 'Size', 'Provider'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#484f58', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(48,54,61,0.4)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c, i) => (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 20px', color: '#30363d', fontSize: '0.78rem' }}>{i + 1}</td>
                        <td style={{ padding: '14px 20px', color: '#e6edf3', fontWeight: '600', fontSize: '0.88rem' }}>{c.name}</td>
                        <td style={{ padding: '14px 20px' }}>
                          {c.website
                            ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: '#58a6ff', textDecoration: 'none', fontSize: '0.85rem' }}
                              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.target.style.textDecoration = 'none'}
                            >{c.website.replace(/https?:\/\//, '')}</a>
                            : <span style={{ color: '#30363d' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.85rem' }}>{c.industry || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.85rem' }}>{c.size || '—'}</td>
                        <td style={{ padding: '14px 20px' }}><ProviderBadge provider={c.provider} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ padding: '48px', textAlign: 'center', color: '#484f58', fontSize: '0.88rem' }}>No companies found.</div>

            ) : activeTab === 'providers' ? (
              providers.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(13,17,23,0.4)' }}>
                      {['Provider', 'Status', 'Data Source', 'Action'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#484f58', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(48,54,61,0.4)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: PROVIDER_COLORS[p.name]?.bg || 'rgba(48,54,61,0.5)',
                              border: `1px solid ${PROVIDER_COLORS[p.name]?.border || '#30363d'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px',
                            }}>
                              {p.name === 'hubspot' ? '🟠' : p.name === 'salesforce' ? '🔵' : p.name === 'pipedrive' ? '🟢' : '🟣'}
                            </div>
                            <span style={{ color: '#e6edf3', fontWeight: '600', fontSize: '0.9rem', textTransform: 'capitalize' }}>{p.displayName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.73rem', fontWeight: '600',
                            background: p.isConnected ? 'rgba(35,134,54,0.15)' : 'rgba(48,54,61,0.4)',
                            color: p.isConnected ? '#3fb950' : '#484f58',
                            border: `1px solid ${p.isConnected ? 'rgba(63,185,80,0.3)' : 'rgba(48,54,61,0.6)'}`,
                          }}>
                            {p.isConnected ? '● Connected' : '○ Not Connected'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#8b949e', fontSize: '0.85rem' }}>
                          {p.isMock ? '🧪 Mock Data' : '🔌 OAuth 2.0'}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {!p.isMock && (
                            <button style={{
                              padding: '6px 14px', borderRadius: '8px', fontSize: '0.77rem', fontWeight: '600',
                              border: '1px solid rgba(48,54,61,0.6)', background: 'rgba(33,38,45,0.7)',
                              color: '#484f58', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '5px',
                            }}>
                              Coming soon <ChevronRight size={11} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ padding: '48px', textAlign: 'center', color: '#484f58', fontSize: '0.88rem' }}>No providers found.</div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', color: '#30363d', fontSize: '0.76rem',
        }}>
          <CheckCircle size={12} color="#238636" />
          <span>Powered by Unified CRM API</span>
          <span style={{ color: '#21262d' }}>·</span>
          <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer"
            style={{ color: '#484f58', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#58a6ff'}
            onMouseLeave={e => e.currentTarget.style.color = '#484f58'}
          >
            API Docs <ChevronRight size={11} />
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
