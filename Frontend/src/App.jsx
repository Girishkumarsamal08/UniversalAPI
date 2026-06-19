import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Activity, CheckCircle, Smartphone, Building2, RefreshCw, Shield } from 'lucide-react';

// ✅ Uses Vite proxy → forwards to http://localhost:3000/api/v1
const API_BASE_URL = '/api/v1';

// Demo JWT — auto-login with mock token for development
// In production: get this from /auth/login response
let AUTH_TOKEN = localStorage.getItem('unified_token') || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach token to every request
api.interceptors.request.use((config) => {
  if (AUTH_TOKEN) {
    config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }
  return config;
});

function App() {
  const [contacts, setContacts]     = useState([]);
  const [companies, setCompanies]   = useState([]);
  const [providers, setProviders]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState('contacts');
  const [isLoggedIn, setIsLoggedIn] = useState(!!AUTH_TOKEN);
  const [loginForm, setLoginForm]   = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'contacts') await fetchContacts();
      if (activeTab === 'companies') await fetchCompanies();
      if (activeTab === 'providers') await fetchProviders();
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    const res = await api.get('/contacts?provider=mock&limit=20');
    setContacts(res.data.data?.data || []);
  };

  const fetchCompanies = async () => {
    const res = await api.get('/companies?provider=mock&limit=20');
    setCompanies(res.data.data?.data || []);
  };

  const fetchProviders = async () => {
    const res = await api.get('/providers');
    setProviders(res.data.data || []);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.post('/auth/login', loginForm);
      AUTH_TOKEN = res.data.data.tokens.accessToken;
      localStorage.setItem('unified_token', AUTH_TOKEN);
      setIsLoggedIn(true);
    } catch {
      setLoginError('Invalid credentials. Try: admin@unifiedcrm.io / Password123');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.post('/auth/register', {
        name: 'Demo User',
        email: loginForm.email,
        password: loginForm.password,
        organizationName: 'My Organization',
      });
      AUTH_TOKEN = res.data.data.tokens.accessToken;
      localStorage.setItem('unified_token', AUTH_TOKEN);
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Registration failed. Check your details.');
    }
  };

  const handleLogout = () => {
    AUTH_TOKEN = '';
    localStorage.removeItem('unified_token');
    setIsLoggedIn(false);
    setContacts([]);
    setCompanies([]);
  };

  // ─────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="dashboard" style={{ maxWidth: '420px', margin: '80px auto' }}>
        <div className="header">
          <h1>🔗 Unified CRM API</h1>
          <p style={{ color: '#8b949e', marginTop: '10px' }}>
            {registering ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>
        <div className="card">
          <form onSubmit={registering ? handleRegister : handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#8b949e', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                placeholder="admin@unifiedcrm.io"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                style={{
                  width: '100%', padding: '10px 14px', background: '#0d1117',
                  border: '1px solid #30363d', borderRadius: '8px', color: '#e6edf3',
                  fontSize: '0.95rem', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#8b949e', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Password</label>
              <input
                type="password"
                placeholder="Password123"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                style={{
                  width: '100%', padding: '10px 14px', background: '#0d1117',
                  border: '1px solid #30363d', borderRadius: '8px', color: '#e6edf3',
                  fontSize: '0.95rem', boxSizing: 'border-box'
                }}
              />
            </div>
            {loginError && (
              <div style={{ color: '#f85149', fontSize: '0.85rem', marginBottom: '16px', padding: '10px', background: 'rgba(248,81,73,0.1)', borderRadius: '6px' }}>
                {loginError}
              </div>
            )}
            <button type="submit" className="connect-btn" style={{ width: '100%', justifyContent: 'center' }}>
              <Shield size={16} /> {registering ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <p style={{ color: '#8b949e', fontSize: '0.82rem', textAlign: 'center', marginTop: '16px' }}>
            {registering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span
              onClick={() => { setRegistering(!registering); setLoginError(''); }}
              style={{ color: '#58a6ff', cursor: 'pointer' }}
            >
              {registering ? 'Sign in' : 'Register'}
            </span>
          </p>
          <p style={{ color: '#484f58', fontSize: '0.78rem', textAlign: 'center', marginTop: '8px' }}>
            Demo: admin@unifiedcrm.io / Password123
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MAIN DASHBOARD
  // ─────────────────────────────────────────────
  return (
    <div className="dashboard">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🔗 Unified API Dashboard</h1>
            <p style={{ color: '#8b949e', marginTop: '10px' }}>Manage all your CRM integrations in one place</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: '1px solid #30363d', color: '#8b949e',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          {['contacts', 'companies', 'providers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: activeTab === tab ? '#1f6feb' : '#21262d',
                color: activeTab === tab ? 'white' : '#8b949e',
                fontWeight: activeTab === tab ? '600' : '400',
                textTransform: 'capitalize', fontSize: '0.9rem'
              }}
            >
              {tab === 'contacts' && '👤 '}
              {tab === 'companies' && '🏢 '}
              {tab === 'providers' && '🔌 '}
              {tab}
            </button>
          ))}
          <button
            onClick={fetchData}
            style={{
              marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px',
              border: '1px solid #30363d', background: 'transparent', color: '#8b949e',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="card">
        {/* Tab Headers */}
        <div className="status-row">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeTab === 'contacts'  && <><User color="#58a6ff" /> Unified Contacts</>}
              {activeTab === 'companies' && <><Building2 color="#58a6ff" /> Unified Companies</>}
              {activeTab === 'providers' && <><Activity color="#58a6ff" /> CRM Providers</>}
            </h2>
            <p style={{ color: '#8b949e', margin: '4px 0 0', fontSize: '0.85rem' }}>
              Normalized data from all connected CRM providers
            </p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem',
            background: 'rgba(35,134,54,0.15)', color: '#3fb950',
            border: '1px solid rgba(63,185,80,0.3)', fontWeight: '600'
          }}>
            ● LIVE
          </span>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : error ? (
            <div className="empty-state" style={{ color: '#f85149' }}>{error}</div>

          /* ─── CONTACTS TABLE ─── */
          ) : activeTab === 'contacts' ? (
            contacts.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Job Title</th>
                    <th>Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '500', color: '#e6edf3' }}>{c.name || '-'}</td>
                      <td>{c.email || '-'}</td>
                      <td>{c.phone || '-'}</td>
                      <td>{c.jobTitle || '-'}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem',
                          background: 'rgba(56,139,253,0.15)', color: '#58a6ff',
                          border: '1px solid rgba(56,139,253,0.3)', textTransform: 'capitalize'
                        }}>
                          {c.provider}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No contacts found.</div>
            )

          /* ─── COMPANIES TABLE ─── */
          ) : activeTab === 'companies' ? (
            companies.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Website</th>
                    <th>Industry</th>
                    <th>Size</th>
                    <th>Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '500', color: '#e6edf3' }}>{c.name}</td>
                      <td>
                        {c.website
                          ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: '#58a6ff' }}>{c.website.replace('https://', '')}</a>
                          : '-'}
                      </td>
                      <td>{c.industry || '-'}</td>
                      <td>{c.size || '-'}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem',
                          background: 'rgba(56,139,253,0.15)', color: '#58a6ff',
                          border: '1px solid rgba(56,139,253,0.3)', textTransform: 'capitalize'
                        }}>
                          {c.provider}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No companies found.</div>
            )

          /* ─── PROVIDERS TABLE ─── */
          ) : activeTab === 'providers' ? (
            providers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '500', color: '#e6edf3', textTransform: 'capitalize' }}>{p.displayName}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem',
                          background: p.isConnected ? 'rgba(35,134,54,0.15)' : 'rgba(110,118,129,0.1)',
                          color: p.isConnected ? '#3fb950' : '#8b949e',
                          border: `1px solid ${p.isConnected ? 'rgba(63,185,80,0.3)' : '#30363d'}`
                        }}>
                          {p.isConnected ? '● Connected' : '○ Not Connected'}
                        </span>
                      </td>
                      <td style={{ color: '#8b949e', fontSize: '0.85rem' }}>
                        {p.isMock ? '🧪 Mock Data' : '🔌 OAuth'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No providers found.</div>
            )
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: '32px', color: '#484f58', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
        <CheckCircle size={13} color="#238636" /> Powered by Unified CRM API &nbsp;|&nbsp;
        <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer" style={{ color: '#58a6ff' }}>
          View API Docs →
        </a>
      </div>
    </div>
  );
}

export default App;
