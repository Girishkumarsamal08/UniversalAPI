import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  User, Activity, CheckCircle, Building2, RefreshCw,
  Shield, Eye, EyeOff, LogOut, Wifi, WifiOff, AlertCircle,
  Zap, ChevronRight, BarChart3, Terminal, BookOpen, ExternalLink,
  Globe, Copy, Check, Play, Settings, Menu, X, Briefcase,
  LayoutDashboard, Grid, Cpu, GitMerge, Compass, HelpCircle,
  Users, FileText, Map, Code, Clock, ArrowRight, Lock, Server,
  CheckSquare, Info, Book, File, Layers
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
    AUTH_TOKEN = '';
    localStorage.removeItem('unified_token');
    localStorage.removeItem('unified_user');
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
        display: 'flex', alignItems: 'center', color: '#8b949e', outline: 'none',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
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
  const [logs,         setLogs]        = useState([]);
  const [analytics,    setAnalytics]   = useState(null);
  const [loading,      setLoading]     = useState(false);
  const [fetchError,   setFetchError]  = useState('');
  const [activeTab,    setActiveTab]   = useState('dashboard');
  const [isLoggedIn,   setIsLoggedIn]  = useState(!!AUTH_TOKEN);
  const [registering,  setRegistering] = useState(false);
  const [showPwd,      setShowPwd]     = useState(false);
  const [loginForm,    setLoginForm]   = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    department: 'Engineering',
    role: 'Developer'
  });
  const [loginError,   setLoginError]  = useState('');
  const [loginLoading, setLoginLoading]= useState(false);
  const [backendDown,  setBackendDown] = useState(false);
  
  // Custom features states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [isSyncing, setIsSyncing] = useState({});
  const [toast, setToast] = useState(null);

  // Enterprise tenancy & RBAC states
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('unified_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [approvals, setApprovals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // API Playground states
  const [playgroundMethod, setPlaygroundMethod] = useState('GET');
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('/contacts');
  const [playgroundHeaders, setPlaygroundHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [playgroundParams, setPlaygroundParams] = useState([{ key: 'limit', value: '10' }]);
  const [playgroundBody, setPlaygroundBody] = useState('{\n  "name": "Jane Doe",\n  "email": "jane@example.com",\n  "phone": "555-0199",\n  "jobTitle": "Product Manager",\n  "provider": "mock"\n}');
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundLatency, setPlaygroundLatency] = useState(null);
  const [playgroundPayloadSize, setPlaygroundPayloadSize] = useState(null);
  const [playgroundHistory, setPlaygroundHistory] = useState([
    { method: 'GET', endpoint: '/contacts', timestamp: '10:05 AM', status: 200, latency: '42ms' },
    { method: 'GET', endpoint: '/companies', timestamp: '10:02 AM', status: 200, latency: '35ms' },
    { method: 'POST', endpoint: '/contacts', timestamp: '09:55 AM', status: 201, latency: '89ms' },
  ]);
  const [playgroundActiveTab, setPlaygroundActiveTab] = useState('params');
  const [copied, setCopied] = useState(false);

  // Normalization Explorer states
  const [explorerProvider, setExplorerProvider] = useState('hubspot');
  const [explorerModel, setExplorerModel] = useState('contact');

  // Marketplace filter state
  const [marketFilter, setMarketFilter] = useState('all');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      // Redirect out of unauthorized views if not approved yet
      if (currentUser?.status === 'PENDING') {
        setLoading(false);
        return;
      }

      // Fetch org projects and approvals for managers/admins
      const hasApprovalPerm = currentUser?.role === 'CTO' || currentUser?.role === 'Admin';
      
      const promises = [
        api.get('/integrations'),
        api.get('/contacts?limit=50').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/companies?limit=50').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/analytics').catch(() => ({ data: { data: null } })),
        api.get('/logs?limit=50').catch(() => ({ data: { data: [] } })),
        api.get('/projects').catch(() => ({ data: { data: [] } }))
      ];

      if (hasApprovalPerm) {
        promises.push(api.get('/approvals').catch(() => ({ data: { data: [] } })));
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      const [rIntegrations, rContacts, rCompanies, rAnalytics, rLogs, rProjects, rApprovals] = await Promise.all(promises);
      
      setProviders(rIntegrations.data?.data || []);
      setContacts(rContacts.data?.data?.data || []);
      setCompanies(rCompanies.data?.data?.data || []);
      setAnalytics(rAnalytics.data?.data || null);
      setLogs(rLogs.data?.data || []);
      setProjects(rProjects.data?.data || []);
      setApprovals(rApprovals.data?.data || []);
      setBackendDown(false);
    } catch (err) {
      if (!err.response) {
        setBackendDown(true);
        setFetchError('Backend server is not reachable. Run: cd backend && npm run dev');
      } else {
        setFetchError(err.response?.data?.message || `Error ${err.response?.status}: Something went wrong.`);
      }
    } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn, activeTab, fetchData]);

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        const prov = event.data.provider;
        const displayName = prov.charAt(0).toUpperCase() + prov.slice(1);
        showToast(`${displayName} connected successfully.`);
        fetchData();
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError(''); setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginForm.email, password: loginForm.password });
      AUTH_TOKEN = res.data.data.accessToken;
      localStorage.setItem('unified_token', AUTH_TOKEN);
      localStorage.setItem('unified_user', JSON.stringify(res.data.data.user));
      setCurrentUser(res.data.data.user);
      setIsLoggedIn(true);
    } catch (err) {
      if (!err.response) setLoginError('⚠️ Backend not running. Start: cd backend && npm run dev');
      else if (err.response?.status === 401) setLoginError('❌ Wrong email or password.');
      else setLoginError('❌ ' + (err.response?.data?.message || 'Login failed. Try again.'));
    } finally { setLoginLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoginError(''); setLoginLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: loginForm.name.trim() || loginForm.email.split('@')[0] || 'User',
        email: loginForm.email,
        password: loginForm.password,
        organizationName: loginForm.organizationName,
        department: loginForm.department,
        role: loginForm.role
      });
      AUTH_TOKEN = res.data.data.accessToken;
      localStorage.setItem('unified_token', AUTH_TOKEN);
      localStorage.setItem('unified_user', JSON.stringify(res.data.data.user));
      setCurrentUser(res.data.data.user);
      setIsLoggedIn(true);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (!err.response) {
        setLoginError('⚠️ Backend not running. Start: cd backend && npm run dev');
      } else {
        setLoginError('❌ ' + (msg || 'Registration failed. Business email required. Password needs 8+ chars.'));
      }
    } finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('unified_token');
    localStorage.removeItem('unified_user');
    AUTH_TOKEN = '';
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const handleConnect = async (provider) => {
    try {
      const res = await api.post(`/integrations/${provider}/connect`);
      if (res.data.data?.status === 'PENDING_APPROVAL') {
        showToast('Connection request submitted for administrator approval.', 'info');
        fetchData();
        return;
      }
      const authUrl = res.data.data.url;
      const width = 600, height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        authUrl,
        `Connect ${provider}`,
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );
    } catch (err) {
      showToast(`Connection failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const confirmDisconnect = (provider) => {
    setShowConfirmModal(provider);
  };

  const handleDisconnect = async () => {
    const provider = showConfirmModal;
    setShowConfirmModal(null);
    try {
      const res = await api.post(`/integrations/${provider}/disconnect`);
      if (res.data.data?.status === 'PENDING_APPROVAL') {
        showToast('Disconnect request submitted for administrator approval.', 'info');
      } else {
        showToast(`${provider.toUpperCase()} connection revoked.`);
      }
      fetchData();
    } catch (err) {
      showToast(`Failed to disconnect: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleSync = async (provider) => {
    setIsSyncing(prev => ({ ...prev, [provider]: true }));
    try {
      const r = await api.post(`/integrations/${provider}/sync`);
      showToast(`Sync complete! Mapped ${r.data.data.syncedCounts.contacts} contacts and ${r.data.data.syncedCounts.companies} companies.`);
      fetchData();
    } catch (err) {
      showToast('Sync failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsSyncing(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleResolveApproval = async (id, resolution) => {
    try {
      await api.post(`/approvals/${id}/resolve`, { resolution });
      showToast(`Request resolved: ${resolution}`);
      fetchData();
    } catch (err) {
      showToast('Failed to resolve request: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      await api.post('/projects', { name: newProjectName, description: newProjectDesc });
      showToast('Project created successfully!');
      setNewProjectName('');
      setNewProjectDesc('');
      fetchData();
    } catch (err) {
      showToast('Failed to create project: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handlePlaygroundSend = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    const startTime = Date.now();
    try {
      const qParams = {};
      playgroundParams.forEach(p => { if (p.key) qParams[p.key] = p.value; });
      const queryStr = new URLSearchParams(qParams).toString();
      
      const headers = {};
      playgroundHeaders.forEach(h => { if (h.key) headers[h.key] = h.value; });

      const finalPath = playgroundEndpoint + (queryStr ? `?${queryStr}` : '');
      
      let res;
      if (playgroundMethod === 'GET') {
        res = await api.get(finalPath, { headers });
      } else if (playgroundMethod === 'POST') {
        const body = JSON.parse(playgroundBody);
        res = await api.post(playgroundEndpoint, body, { headers });
      } else if (playgroundMethod === 'PATCH') {
        const body = JSON.parse(playgroundBody);
        res = await api.patch(playgroundEndpoint, body, { headers });
      } else if (playgroundMethod === 'DELETE') {
        res = await api.delete(finalPath, { headers });
      }

      const latency = Date.now() - startTime;
      const sizeBytes = JSON.stringify(res.data).length;
      const sizeText = sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(2)} KB` : `${sizeBytes} B`;

      setPlaygroundLatency(`${latency}ms`);
      setPlaygroundPayloadSize(sizeText);
      setPlaygroundResponse({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data: res.data,
      });

      const historyItem = {
        method: playgroundMethod,
        endpoint: playgroundEndpoint,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: res.status,
        latency: `${latency}ms`,
      };
      setPlaygroundHistory(prev => [historyItem, ...prev.slice(0, 19)]);
    } catch (err) {
      const latency = Date.now() - startTime;
      setPlaygroundLatency(`${latency}ms`);
      setPlaygroundPayloadSize('N/A');
      setPlaygroundResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        data: err.response?.data || { message: err.message },
      });
    } finally {
      setPlaygroundLoading(false);
      fetchData();
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ══════════════════════════════════════
  // REGISTER & LOGIN SCREEN
  // ══════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #0d1b2e 0%, #07090e 100%)',
        fontFamily: "'Inter', -apple-system, sans-serif", padding: '24px', boxSizing: 'border-box'
      }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(31,111,235,0.06) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 60%)', borderRadius: '50%' }} />
        
        <div style={{
          width: '100%', maxWidth: registering ? '480px' : '420px', background: 'rgba(13,17,23,0.7)',
          backdropFilter: 'blur(24px)', border: '1px solid rgba(48,54,61,0.6)',
          borderRadius: '16px', padding: '36px', boxSizing: 'border-box',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          transition: 'all 0.25s'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', gap: '8px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(31,111,235,0.3)',
            }}>
              <Activity size={26} color="white" />
            </div>
            <h1 style={{ color: '#e6edf3', fontSize: '1.4rem', fontWeight: '800', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>Universal API</h1>
            <p style={{ color: '#8b949e', fontSize: '0.82rem', margin: 0 }}>Enterprise Multi-Tenant CRM Normalization Gateway</p>
          </div>

          <form onSubmit={registering ? handleRegister : handleLogin}>
            {registering && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="login-name" style={{ display: 'block', color: '#8b949e', fontSize: '0.74rem', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Full Name</label>
                  <input id="login-name" type="text" placeholder="John Doe"
                    value={loginForm.name} onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
                    required style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none' }} />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="login-org" style={{ display: 'block', color: '#8b949e', fontSize: '0.74rem', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Company / Organization Name</label>
                  <input id="login-org" type="text" placeholder="Acme Corp"
                    value={loginForm.organizationName} onChange={e => setLoginForm({ ...loginForm, organizationName: e.target.value })}
                    required={loginForm.role === 'CTO' || loginForm.role === 'Admin'}
                    style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none' }} />
                </div>
              </>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="login-email" style={{ display: 'block', color: '#8b949e', fontSize: '0.74rem', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Business Email</label>
              <input id="login-email" type="email" placeholder="you@company.com"
                value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                required style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: registering ? '16px' : '20px', position: 'relative' }}>
              <label htmlFor="login-password" style={{ display: 'block', color: '#8b949e', fontSize: '0.74rem', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input id="login-password" type={showPwd ? 'text' : 'password'} placeholder="••••••••••"
                  value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  required style={{ width: '100%', padding: '10px 40px 10px 14px', boxSizing: 'border-box', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none' }} />
                <EyeToggle show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
              </div>
            </div>

            {registering && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.74rem', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Department</label>
                  <select value={loginForm.department} onChange={e => setLoginForm({ ...loginForm, department: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.84rem', outline: 'none' }}>
                    {['Engineering', 'Sales', 'Support', 'Finance', 'QA', 'HR', 'Product'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.74rem', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Role Scope</label>
                  <select value={loginForm.role} onChange={e => setLoginForm({ ...loginForm, role: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.84rem', outline: 'none' }}>
                    {['CTO', 'Admin', 'Regional Head', 'Engineering Manager', 'Team Lead', 'Senior Developer', 'Developer', 'QA Engineer', 'Support Engineer', 'Intern'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}

            {loginError && (
              <div style={{
                marginBottom: '16px', padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(248,81,73,0.07)', border: '1px solid rgba(248,81,73,0.2)',
              }}>
                <span style={{ color: '#f85149', fontSize: '0.8rem', lineHeight: '1.4' }}>{loginError}</span>
              </div>
            )}

            <button id="login-submit" type="submit" disabled={loginLoading} style={{
              width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
              color: 'white', fontSize: '0.92rem', fontWeight: '700', cursor: loginLoading ? 'wait' : 'pointer',
              boxShadow: '0 8px 24px rgba(31,111,235,0.25)', transition: 'all 0.2s',
            }}>
              {loginLoading ? 'Authenticating...' : registering ? 'Register Workspace' : 'Access Console'}
            </button>

            <button type="button" onClick={() => { setRegistering(r => !r); setLoginError(''); }} style={{
              background: 'none', border: 'none', color: '#58a6ff', fontSize: '0.8rem',
              cursor: 'pointer', display: 'block', margin: '16px auto 0', textDecoration: 'none'
            }}>
              {registering ? 'Already registered? Sign in' : "Don't have an enterprise workspace? Register"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // PENDING APPROVAL BLOCKER SCREEN
  // ══════════════════════════════════════
  if (currentUser?.status === 'PENDING') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #0d1b2e 0%, #07090e 100%)',
        fontFamily: "'Inter', -apple-system, sans-serif", padding: '24px'
      }}>
        <div style={{
          width: '100%', maxWidth: '460px', background: 'rgba(13,17,23,0.75)',
          backdropFilter: 'blur(20px)', border: '1px solid rgba(48,54,61,0.7)',
          borderRadius: '16px', padding: '40px', boxSizing: 'border-box',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)', textAlign: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Lock size={28} color="#d29922" />
          </div>

          <h2 style={{ color: '#e6edf3', fontSize: '1.25rem', fontWeight: '800', margin: '0 0 10px' }}>Workspace Approval Pending</h2>
          
          <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: '0 0 24px' }}>
            Thanks for registering, <strong>{currentUser.name}</strong>! Your account under domain <code>{currentUser.email.split('@')[1]}</code> is pending approval from your organization's CTO or verified administrator.
          </p>

          <div style={{
            padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(48,54,61,0.3)',
            borderRadius: '8px', fontSize: '0.78rem', color: '#c9d1d9', marginBottom: '24px', textAlign: 'left'
          }}>
            <strong>Pending details:</strong>
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px', color: '#8b949e' }}>
              <span>• Role: {currentUser.role}</span>
              <span>• Department: {currentUser.department}</span>
              <span>• Status: Awaiting Verification</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchData} style={{ flex: 1, padding: '10px', background: '#1f6feb', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}>
              Check Status
            </button>
            <button onClick={handleLogout} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(248,81,73,0.3)', color: '#f85149', borderRadius: '8px', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // CORE ENTERPRISE NAVIGATION DRAWER SETUP
  // ══════════════════════════════════════
  const userPermissions = currentUser?.permissions || [];
  const hasAccess = (perm) => currentUser?.role === 'CTO' || currentUser?.role === 'Admin' || userPermissions.includes(perm);

  const TABS = [
    { id: 'dashboard',       label: 'Dashboard',             icon: <LayoutDashboard size={15} /> },
    { id: 'contacts',        label: 'Contacts',              icon: <User size={15} />, count: contacts.length, permission: 'view_projects' },
    { id: 'companies',       label: 'Companies',             icon: <Building2 size={15} />, count: companies.length, permission: 'view_projects' },
    { id: 'integrations',    label: 'Integrations',          icon: <Activity size={15} />, permission: 'view_dashboard' },
    { id: 'projects',        label: 'Workspace Projects',    icon: <Briefcase size={15} />, count: projects.length, permission: 'view_projects' },
    { id: 'feature-matrix',  label: 'Feature Matrix',        icon: <Grid size={15} />, permission: 'view_dashboard' },
    { id: 'api-playground',  label: 'API Playground',        icon: <Play size={15} />, permission: 'use_playground' },
    { id: 'flow',            label: 'End-to-End Flow',       icon: <GitMerge size={15} />, permission: 'view_dashboard' },
    { id: 'architecture',    label: 'Architecture',          icon: <Cpu size={15} />, permission: 'view_dashboard' },
    { id: 'explorer',        label: 'Normalization Explorer',icon: <Compass size={15} />, permission: 'use_playground' },
    { id: 'challenges',      label: 'Technical Challenges',  icon: <HelpCircle size={15} />, permission: 'view_docs' },
    { id: 'dx',              label: 'Developer Experience',  icon: <Code size={15} />, permission: 'view_docs' },
    { id: 'roadmap',         label: 'Future Roadmap',        icon: <Map size={15} />, permission: 'view_docs' },
    { id: 'team',            label: 'Team & Ownership',      icon: <Users size={15} />, permission: 'view_docs' },
    { id: 'enterprise',      label: 'Enterprise Specs',      icon: <Shield size={15} />, permission: 'view_docs' },
    { id: 'docs',            label: 'Documentation',         icon: <FileText size={15} />, permission: 'view_docs' },
    { id: 'logs',            label: 'Request Logs',          icon: <Terminal size={15} />, permission: 'view_logs' },
    { id: 'analytics',       label: 'Analytics',             icon: <BarChart3 size={15} />, permission: 'view_analytics' },
  ];

  const renderSidebarTab = (tab) => {
    if (tab.permission && !hasAccess(tab.permission)) return null;
    const active = activeTab === tab.id;
    return (
      <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
        style={{
          padding: '10px 14px', borderRadius: '8px', border: 'none', textAlign: 'left',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
          background: active ? 'linear-gradient(135deg, #1f6feb, #8b5cf6)' : 'transparent',
          color: active ? 'white' : '#8b949e', fontWeight: active ? '700' : '500',
          fontSize: '0.85rem', transition: 'all 0.15s', width: '100%'
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        {tab.icon}
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
        {tab.count > 0 && (
          <span style={{
            padding: '1px 5px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '700',
            background: active ? 'rgba(255,255,255,0.2)' : 'rgba(48,54,61,0.5)',
            color: active ? 'white' : '#8b949e',
          }}>{tab.count}</span>
        )}
      </button>
    );
  };

  const connectedCrmCount = providers.filter(p => p.status === 'Connected').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 15% 10%, #0d1b2e 0%, #0d1117 50%, #0a0e14 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(31,111,235,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* ══════════════════════════════════════
          TOP NAVBAR
         ══════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(48,54,61,0.6)', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setIsSidebarOpen(true)} style={{
            background: 'none', color: '#8b949e', cursor: 'pointer',
            display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '6px',
            transition: 'background 0.2s', border: '1px solid rgba(48,54,61,0.5)'
          }}>
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '6px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={15} color="white" />
            </div>
            <span style={{ color: '#e6edf3', fontSize: '0.98rem', fontWeight: '800', letterSpacing: '-0.01em' }}>Universal API</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.74rem' }}>
            <span style={{ color: '#e6edf3', fontWeight: '700' }}>{currentUser?.name}</span>
            <span style={{ color: '#8b949e' }}>{currentUser?.role} ({currentUser?.department})</span>
          </div>

          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(248,81,73,0.3)',
            color: '#f85149', fontSize: '0.8rem', padding: '6px 14px', borderRadius: '6px',
            cursor: 'pointer', transition: 'all 0.15s', fontWeight: '600'
          }}>
            Logout
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          SLIDING SIDEBAR NAVIGATION DRAWER
         ══════════════════════════════════════ */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10,14,20,0.6)', backdropFilter: 'blur(4px)', zIndex: 999,
        }} />
      )}

      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '300px',
        background: '#0d1117', borderRight: '1px solid rgba(48,54,61,0.8)', zIndex: 1000,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box',
        boxShadow: isSidebarOpen ? '24px 0 80px rgba(0,0,0,0.8)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={22} color="#1f6feb" />
            <span style={{ color: '#e6edf3', fontSize: '0.95rem', fontWeight: '700' }}>Workspace Navigation</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          <div>
            <h5 style={{ color: '#484f58', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 10px' }}>Core Operations</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {TABS.filter(t => ['dashboard', 'contacts', 'companies', 'integrations', 'projects', 'logs', 'analytics'].includes(t.id)).map(renderSidebarTab)}
            </div>
          </div>
          <div>
            <h5 style={{ color: '#484f58', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 10px' }}>SaaS Console</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {TABS.filter(t => ['feature-matrix', 'api-playground', 'explorer', 'flow'].includes(t.id)).map(renderSidebarTab)}
            </div>
          </div>
          <div>
            <h5 style={{ color: '#484f58', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 10px' }}>Resources & Specs</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {TABS.filter(t => ['architecture', 'challenges', 'dx', 'roadmap', 'team', 'enterprise', 'docs'].includes(t.id)).map(renderSidebarTab)}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MAIN BODY LAYOUT
         ══════════════════════════════════════ */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 32px 64px', position: 'relative', zIndex: 10 }}>
        
        {/* Dashboard Org Header */}
        <div style={{
          background: 'rgba(22,27,34,0.4)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(48,54,61,0.5)', borderRadius: '16px',
          padding: '24px 28px', marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex',
          flexDirection: 'column', gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'rgba(31,111,235,0.15)', color: '#58a6ff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', border: '1px solid rgba(31,111,235,0.25)' }}>Tenant Workspace</span>
            <span style={{ color: '#8b949e', fontSize: '0.8rem' }}>/</span>
            <span style={{ color: '#c9d1d9', fontSize: '0.88rem', fontWeight: '600' }}>Organization ID: {currentUser?.organizationId || 'Mock Organization'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(31,111,235,0.1)', border: '1px solid rgba(31,111,235,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Server size={17} color="#58a6ff" />
              </div>

              <div>
                <h2 style={{ margin: 0, color: '#e6edf3', fontSize: '1.05rem', fontWeight: '700' }}>
                  {activeTab === 'dashboard'    && `${currentUser?.role} Console Dashboard`}
                  {activeTab === 'contacts'     && 'Unified Contacts'}
                  {activeTab === 'companies'    && 'Unified Companies'}
                  {activeTab === 'integrations' && 'Integration Marketplace'}
                  {activeTab === 'projects'     && 'Workspace Projects'}
                  {activeTab === 'feature-matrix' && 'Feature Matrix'}
                  {activeTab === 'api-playground' && 'API Playground'}
                  {activeTab === 'flow'         && 'End-to-End Data Flow'}
                  {activeTab === 'architecture' && 'System Architecture'}
                  {activeTab === 'explorer'     && 'API Normalization Explorer'}
                  {activeTab === 'challenges'   && 'Technical Challenges & Resolutions'}
                  {activeTab === 'dx'           && 'Developer Experience Portal'}
                  {activeTab === 'roadmap'      && 'Future Product Roadmap'}
                  {activeTab === 'team'         && 'Team & Module Ownership'}
                  {activeTab === 'enterprise'   && 'Enterprise Readiness Specs'}
                  {activeTab === 'docs'         && 'Project Documentation'}
                  {activeTab === 'logs'         && 'API Request Logs'}
                  {activeTab === 'analytics'    && 'System Analytics'}
                </h2>
                <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', marginTop: '2px' }}>
                  {activeTab === 'dashboard'    && `Logged in as ${currentUser?.name}. Isolated scope: ${currentUser?.department} Department.`}
                  {activeTab === 'contacts'     && 'Normalized contacts filtered strictly by organization boundary.'}
                  {activeTab === 'companies'    && 'Normalized companies filtered strictly by organization boundary.'}
                  {activeTab === 'integrations' && 'Centralized OAuth Vault marketplace for 3rd-party connectors.'}
                  {activeTab === 'projects'     && 'Isolated project workspaces assigned to developers.'}
                  {activeTab === 'feature-matrix' && 'Pillars of the Universal API Platform: Build, Integrate, Test, and Automate.'}
                  {activeTab === 'api-playground' && 'Postman-like request builder sandbox.'}
                  {activeTab === 'flow'         && 'Visual mapping trace explaining real-time request lifecycle.'}
                  {activeTab === 'architecture' && 'Structural flow-topology of the Gateway, Sync Paths, and Async Workers.'}
                  {activeTab === 'explorer'     && 'Demonstrating HubSpot, Salesforce, Pipedrive API schema vs. Normalized response.'}
                  {activeTab === 'challenges'   && 'Hard technical challenges faced in multi-tenant environments.'}
                  {activeTab === 'dx'           && 'SDK code examples and Quick Start reference guidelines.'}
                  {activeTab === 'roadmap'      && 'Future vertical expansion roadmap specifications.'}
                  {activeTab === 'team'         && 'Team roster, project responsibilities, and module owners.'}
                  {activeTab === 'enterprise'   && 'Enterprise specifications metrics for security, isolation and compliance.'}
                  {activeTab === 'docs'         && 'Engineering wiki, project overview, and specifications guidelines.'}
                  {activeTab === 'logs'         && 'Live feed of HTTP requests processed by the API gateway.'}
                  {activeTab === 'analytics'    && 'System request volume, latency, and integration usage metrics.'}
                </p>
              </div>
            </div>
          </div>
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
              Backend is offline. Open a terminal and run `npm run dev` to start dev servers.
            </span>
          </div>
        )}

        {/* ══════════════════════════════════════
            HORIZONTAL SCROLLABLE TABS BAR
           ══════════════════════════════════════ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', overflowX: 'auto',
          paddingBottom: '8px', borderBottom: '1px solid rgba(48,54,61,0.3)'
        }}>
          {TABS.map(tab => {
            if (tab.permission && !hasAccess(tab.permission)) return null;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                background: active ? 'linear-gradient(135deg, #1f6feb, #8b5cf6)' : 'rgba(33,38,45,0.4)',
                color: active ? 'white' : '#8b949e',
                fontWeight: active ? '700' : '500',
                fontSize: '0.82rem',
                transition: 'all 0.15s',
              }}>
                {tab.icon}
                {tab.label}
              </button>
            );
          })}

          <button id="refresh-btn" onClick={fetchData} disabled={loading} style={{
            marginLeft: 'auto', padding: '8px 14px', borderRadius: '8px',
            border: '1px solid rgba(48,54,61,0.6)', background: 'rgba(33,38,45,0.5)',
            color: '#c9d1d9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.15s'
          }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Sync Workspace
          </button>
        </div>

        {/* ══════════════════════════════════════
            TAB PANEL RENDER SWITCH
           ══════════════════════════════════════ */}
        <div style={{
          background: 'rgba(13,17,23,0.3)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(48,54,61,0.5)', borderRadius: '16px',
          padding: '24px', minHeight: '400px', boxShadow: '0 12px 48px rgba(0,0,0,0.35)'
        }}>

          {loading && activeTab !== 'dashboard' && activeTab !== 'api-playground' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f6feb" strokeWidth="2.5"
                style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
              </svg>
              <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>Synchronizing data…</span>
            </div>

          ) : fetchError && activeTab !== 'dashboard' && activeTab !== 'api-playground' ? (
            <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <AlertCircle size={22} color="#f85149" />
              <p style={{ color: '#8b949e', margin: 0, fontSize: '0.88rem' }}>{fetchError}</p>
              <button onClick={fetchData} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(248,81,73,0.3)', background: 'transparent', color: '#f85149', cursor: 'pointer', fontSize: '0.83rem', fontWeight: '600' }}>Try Again</button>
            </div>

          ) : activeTab === 'dashboard' ? (
            // ==========================================
            // 1. DYNAMIC DUAL-ROLES DASHBOARDS
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(31,111,235,0.04)', border: '1px solid rgba(31,111,235,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Scope role</span>
                  <h3 style={{ color: '#58a6ff', fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>{currentUser?.role}</h3>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Role-specific layouts enabled</span>
                </div>

                <div style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Company Workspace</span>
                  <h3 style={{ color: '#a78bfa', fontSize: '1.3rem', fontWeight: '800', margin: 0, textTransform: 'capitalize' }}>
                    {currentUser?.email.split('@')[1].split('.')[0]}
                  </h3>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Tenant Isolation Active</span>
                </div>

                <div style={{ background: 'rgba(38,184,96,0.04)', border: '1px solid rgba(38,184,96,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Integrations</span>
                  <h3 style={{ color: '#2ed573', fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>{connectedCrmCount} Connected</h3>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Shared at organization scope</span>
                </div>

                <div style={{ background: 'rgba(255,193,7,0.04)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>User Status</span>
                  <h3 style={{ color: '#2ed573', fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>{currentUser?.status}</h3>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Verified account</span>
                </div>
              </div>

              {/* Dynamic content segments based on role */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* A. CTO / Admin approvals panel */}
                {(currentUser?.role === 'CTO' || currentUser?.role === 'Admin') && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px', gridColumn: 'span 2' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={15} color="#58a6ff" /> Workspace Approvals Console ({approvals.length} pending)
                    </h4>

                    {approvals.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.4)', textAlign: 'left', color: '#8b949e' }}>
                              <th style={{ padding: '8px 12px' }}>Requester</th>
                              <th style={{ padding: '8px 12px' }}>Action</th>
                              <th style={{ padding: '8px 12px' }}>Target ID</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {approvals.map((reqItem) => (
                              <tr key={reqItem.id} style={{ borderBottom: '1px solid rgba(48,54,61,0.2)' }}>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#e6edf3', fontWeight: '700' }}>{reqItem.requester?.name || 'Unknown'}</span>
                                    <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>{reqItem.requester?.email}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#a78bfa' }}>{reqItem.action}</td>
                                <td style={{ padding: '12px', color: '#8b949e' }}>{reqItem.targetId || '—'}</td>
                                <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                  <button onClick={() => handleResolveApproval(reqItem.id, 'APPROVED')} style={{ padding: '4px 10px', background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.25)', color: '#2ed573', borderRadius: '4px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700' }}>Approve</button>
                                  <button onClick={() => handleResolveApproval(reqItem.id, 'REJECTED')} style={{ padding: '4px 10px', background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.25)', color: '#f85149', borderRadius: '4px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700' }}>Reject</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e', border: '1px dashed rgba(48,54,61,0.3)', borderRadius: '8px' }}>
                        No pending integration, credential rotation, or registration requests in the queue.
                      </div>
                    )}
                  </div>
                )}

                {/* B. Regional Head regional widgets */}
                {currentUser?.role === 'Regional Head' && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Regional monitoring</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#8b949e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                        <span>US-East latency</span>
                        <strong style={{ color: '#2ed573' }}>12ms</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                        <span>EU-Central latency</span>
                        <strong style={{ color: '#2ed573' }}>48ms</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                        <span>AP-South latency</span>
                        <strong style={{ color: '#d29922' }}>112ms</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* C. Engineering Manager status widgets */}
                {currentUser?.role === 'Engineering Manager' && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Deployments & Builds</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                      <div style={{ padding: '8px', borderLeft: '2px solid #58a6ff', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ color: '#e6edf3', fontWeight: '700', display: 'block' }}>Production build #v1.4.2</span>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Deployed successfully 2h ago</span>
                      </div>
                      <div style={{ padding: '8px', borderLeft: '2px solid #2ed573', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ color: '#e6edf3', fontWeight: '700', display: 'block' }}>Staging connector build</span>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Completed unit tests successfully</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* D. Team Lead sprint board simulator */}
                {currentUser?.role === 'Team Lead' && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Sprint Progress Velocity</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '100px', padding: '10px 0' }}>
                      <div style={{ flex: 1, height: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative' }}><span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: '#8b949e' }}>W1</span></div>
                      <div style={{ flex: 1, height: '65%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative' }}><span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: '#8b949e' }}>W2</span></div>
                      <div style={{ flex: 1, height: '90%', background: 'linear-gradient(to top, #1f6feb, #8b5cf6)', borderRadius: '3px', position: 'relative' }}><span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: '#e6edf3', fontWeight: '700' }}>W3</span></div>
                    </div>
                  </div>
                )}

                {/* E. Developer active projects */}
                {(currentUser?.role === 'Developer' || currentUser?.role === 'Senior Developer') && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Projects ({projects.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {projects.map((proj) => (
                        <div key={proj.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(48,54,61,0.3)', borderRadius: '6px' }}>
                          <span style={{ color: '#e6edf3', fontWeight: '700', fontSize: '0.82rem', display: 'block' }}>{proj.name}</span>
                          <span style={{ color: '#8b949e', fontSize: '0.74rem' }}>{proj.description || 'No description provided'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* F. QA tests statuses */}
                {currentUser?.role === 'QA Engineer' && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>QA Test Suites</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c9d1d9' }}>
                        <span>Adapter transformation tests</span>
                        <strong style={{ color: '#3fb950' }}>100% Passed</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c9d1d9' }}>
                        <span>Token refresh concurrency locks</span>
                        <strong style={{ color: '#3fb950' }}>100% Passed</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* General operational stats */}
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Workspace status</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(7,9,14,0.3)', borderRadius: '8px', border: '1px solid rgba(48,54,61,0.3)' }}>
                      <span style={{ color: '#c9d1d9', fontSize: '0.82rem', fontWeight: '600' }}>Tenant Data Isolation</span>
                      <span style={{ color: '#3fb950', fontSize: '0.78rem', fontWeight: '700' }}>Strict</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(7,9,14,0.3)', borderRadius: '8px', border: '1px solid rgba(48,54,61,0.3)' }}>
                      <span style={{ color: '#c9d1d9', fontSize: '0.82rem', fontWeight: '600' }}>Department Scoping</span>
                      <span style={{ color: '#58a6ff', fontSize: '0.78rem', fontWeight: '700' }}>Active ({currentUser?.department})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'contacts' ? (
            // ==========================================
            // CONTACTS
            // ==========================================
            contacts.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(13,17,23,0.4)' }}>
                      {['#', 'Name', 'Email', 'Phone', 'Job Title', 'Provider'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(48,54,61,0.4)', G: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '14px 20px', color: '#484f58', fontSize: '0.82rem', fontWeight: '600' }}>{i + 1}</td>
                        <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.85rem', fontWeight: '700' }}>{c.name}</td>
                        <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.84rem' }}>{c.email || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.84rem' }}>{c.phone || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.82rem' }}>{c.jobTitle || '—'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <ProviderBadge provider={c.provider} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '64px', textAlign: 'center', color: '#8b949e', fontSize: '0.88rem' }}>
                No synced contacts found for organization. Go to Integrations to connect CRM data.
              </div>
            )

          ) : activeTab === 'companies' ? (
            // ==========================================
            // COMPANIES
            // ==========================================
            companies.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(13,17,23,0.4)' }}>
                      {['#', 'Company Name', 'Website', 'Industry', 'Employees', 'Provider'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(48,54,61,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c, i) => (
                      <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)' }}>
                        <td style={{ padding: '14px 20px', color: '#484f58', fontSize: '0.82rem', fontWeight: '600' }}>{i + 1}</td>
                        <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.85rem', fontWeight: '700' }}>{c.name}</td>
                        <td style={{ padding: '14px 20px', color: '#58a6ff', fontSize: '0.82rem' }}>
                          {c.website ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: '#58a6ff', textDecoration: 'none' }}>{c.website.replace('https://', '')} ↗</a> : '—'}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.82rem' }}>{c.industry || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.82rem' }}>{c.size || '—'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <ProviderBadge provider={c.provider} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '64px', textAlign: 'center', color: '#8b949e', fontSize: '0.88rem' }}>
                No synced companies found for organization. Go to Integrations to connect CRM data.
              </div>
            )

          ) : activeTab === 'projects' ? (
            // ==========================================
            // PROJECTS
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {projects.map((proj) => (
                  <div key={proj.id} style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.94rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={16} color="#58a6ff" /> {proj.name}
                    </h4>
                    <p style={{ margin: '8px 0 12px', color: '#8b949e', fontSize: '0.8rem', lineHeight: '1.4' }}>{proj.description || 'No description provided.'}</p>
                    <span style={{ fontSize: '0.72rem', color: '#58a6ff', background: 'rgba(88,166,255,0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(88,166,255,0.2)' }}>Assigned to User</span>
                  </div>
                ))}
              </div>

              {/* Create project form (CTO or Admin) */}
              {(currentUser?.role === 'CTO' || currentUser?.role === 'Admin') && (
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px', maxWidth: '480px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Create new project</h4>
                  <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b949e', fontSize: '0.78rem', marginBottom: '6px' }}>Project Name</label>
                      <input type="text" value={newProjectName} placeholder="e.g. Finance CRM sync" onChange={e => setNewProjectName(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '6px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b949e', fontSize: '0.78rem', marginBottom: '6px' }}>Description</label>
                      <input type="text" value={newProjectDesc} placeholder="Project scope" onChange={e => setNewProjectDesc(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '6px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <button type="submit" style={{ padding: '8px 16px', background: '#1f6feb', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start' }}>Create</button>
                  </form>
                </div>
              )}
            </div>

          ) : activeTab === 'integrations' ? (
            // ==========================================
            // INTEGRATION MARKETPLACE
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(48,54,61,0.3)', paddingBottom: '10px', overflowX: 'auto' }}>
                {[
                  { id: 'all', label: 'All Verticals' },
                  { id: 'crm', label: 'CRM Platforms' },
                  { id: 'communication', label: 'Communication' },
                  { id: 'email', label: 'Email' },
                  { id: 'calendar', label: 'Calendar' },
                  { id: 'payments', label: 'Payments' },
                  { id: 'commerce', label: 'E-Commerce' },
                ].map(cat => (
                  <button key={cat.id} onClick={() => setMarketFilter(cat.id)} style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem',
                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                    background: marketFilter === cat.id ? 'rgba(31,111,235,0.15)' : 'transparent',
                    color: marketFilter === cat.id ? '#58a6ff' : '#8b949e',
                    border: marketFilter === cat.id ? '1px solid rgba(31,111,235,0.3)' : '1px solid transparent',
                  }}>
                    {cat.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {/* HubSpot */}
                {(marketFilter === 'all' || marketFilter === 'crm') && (() => {
                  const hubspot = providers.find(p => p.provider === 'hubspot') || { status: 'Not Connected' };
                  const isConnected = hubspot.status === 'Connected';
                  return (
                    <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.92rem', fontWeight: '700' }}>HubSpot</h4>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: isConnected ? 'rgba(46,213,115,0.1)' : 'rgba(255,255,255,0.03)', color: isConnected ? '#2ed573' : '#8b949e', border: `1px solid ${isConnected ? 'rgba(46,213,115,0.2)' : 'rgba(48,54,61,0.3)'}` }}>
                            {hubspot.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.4' }}>Sync contacts, companies, deals and lifecycle pipelines.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        {isConnected ? (
                          <>
                            <button onClick={() => handleSync('hubspot')} disabled={isSyncing['hubspot']} style={{ flex: 1, padding: '7px', background: '#21262d', border: '1px solid rgba(240,246,255,0.1)', color: '#c9d1d9', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>
                              {isSyncing['hubspot'] ? 'Syncing...' : 'Sync Now'}
                            </button>
                            <button onClick={() => confirmDisconnect('hubspot')} style={{ padding: '7px 10px', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', color: '#f85149', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Revoke</button>
                          </>
                        ) : (
                          <button onClick={() => handleConnect('hubspot')} style={{ width: '100%', padding: '7px', background: '#1f6feb', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Connect HubSpot</button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Salesforce */}
                {(marketFilter === 'all' || marketFilter === 'crm') && (() => {
                  const sf = providers.find(p => p.provider === 'salesforce') || { status: 'Not Connected' };
                  const isConnected = sf.status === 'Connected';
                  return (
                    <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.92rem', fontWeight: '700' }}>Salesforce</h4>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: isConnected ? 'rgba(46,213,115,0.1)' : 'rgba(255,255,255,0.03)', color: isConnected ? '#2ed573' : '#8b949e', border: `1px solid ${isConnected ? 'rgba(46,213,115,0.2)' : 'rgba(48,54,61,0.3)'}` }}>
                            {sf.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.4' }}>Sync Accounts, Contacts, Opportunities and enterprise pipelines.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        {isConnected ? (
                          <>
                            <button onClick={() => handleSync('salesforce')} disabled={isSyncing['salesforce']} style={{ flex: 1, padding: '7px', background: '#21262d', border: '1px solid rgba(240,246,255,0.1)', color: '#c9d1d9', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>
                              {isSyncing['salesforce'] ? 'Syncing...' : 'Sync Now'}
                            </button>
                            <button onClick={() => confirmDisconnect('salesforce')} style={{ padding: '7px 10px', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', color: '#f85149', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Revoke</button>
                          </>
                        ) : (
                          <button onClick={() => handleConnect('salesforce')} style={{ width: '100%', padding: '7px', background: '#1f6feb', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Connect Salesforce</button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Pipedrive */}
                {(marketFilter === 'all' || marketFilter === 'crm') && (() => {
                  const pd = providers.find(p => p.provider === 'pipedrive') || { status: 'Not Connected' };
                  const isConnected = pd.status === 'Connected';
                  return (
                    <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.92rem', fontWeight: '700' }}>Pipedrive</h4>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: isConnected ? 'rgba(46,213,115,0.1)' : 'rgba(255,255,255,0.03)', color: isConnected ? '#2ed573' : '#8b949e', border: `1px solid ${isConnected ? 'rgba(46,213,115,0.2)' : 'rgba(48,54,61,0.3)'}` }}>
                            {pd.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.4' }}>Sync Persons, Organizations, and Sales pipelines.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        {isConnected ? (
                          <>
                            <button onClick={() => handleSync('pipedrive')} disabled={isSyncing['pipedrive']} style={{ flex: 1, padding: '7px', background: '#21262d', border: '1px solid rgba(240,246,255,0.1)', color: '#c9d1d9', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>
                              {isSyncing['pipedrive'] ? 'Syncing...' : 'Sync Now'}
                            </button>
                            <button onClick={() => confirmDisconnect('pipedrive')} style={{ padding: '7px 10px', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', color: '#f85149', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Revoke</button>
                          </>
                        ) : (
                          <button onClick={() => handleConnect('pipedrive')} style={{ width: '100%', padding: '7px', background: '#1f6feb', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Connect Pipedrive</button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Developer Mock Sandbox */}
                {(marketFilter === 'all' || marketFilter === 'crm') && (
                  <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.92rem', fontWeight: '700' }}>Developer Sandbox (Mock)</h4>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                          Connected
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.4' }}>Simulated static CRM data for rapid testing without credentials.</p>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <button disabled style={{ width: '100%', padding: '7px', background: 'rgba(33,38,45,0.5)', border: '1px solid rgba(48,54,61,0.5)', color: '#8b949e', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'not-allowed' }}>Connected By Default</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          ) : activeTab === 'feature-matrix' ? (
            // ==========================================
            // FEATURE MATRIX
            // ==========================================
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'rgba(31,111,235,0.03)', border: '1px solid rgba(31,111,235,0.15)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Grid size={18} />
                  <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.95rem', fontWeight: '700' }}>BUILD</h4>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#c9d1d9' }}>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Custom API Builder</li>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ OpenAPI Ingestion</li>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Dynamic schemas registration</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Cpu size={18} />
                  <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.95rem', fontWeight: '700' }}>INTEGRATE</h4>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#c9d1d9' }}>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ OAuth Connections</li>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Symmetric DB Encryption</li>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Mapped connector adaptors</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(255,193,7,0.03)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#d29922', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Play size={18} />
                  <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.95rem', fontWeight: '700' }}>TEST</h4>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#c9d1d9' }}>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Postman Sandbox Builder</li>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Mock API servers</li>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Latency response tracking</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(38,184,96,0.03)', border: '1px solid rgba(38,184,96,0.15)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#2ed573', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Zap size={18} />
                  <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.95rem', fontWeight: '700' }}>AUTOMATE</h4>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#c9d1d9' }}>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Background worker queue</li>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Webhook notifications</li>
                  <li style={{ display: 'flex', gap: '8px' }}>✓ Auto token refresh loop</li>
                </ul>
              </div>
            </div>

          ) : activeTab === 'api-playground' ? (
            // ==========================================
            // API PLAYGROUND (Postman Clone)
            // ==========================================
            <div style={{ display: 'flex', minHeight: '520px', background: 'rgba(10,14,20,0.4)', border: '1px solid rgba(48,54,61,0.4)', borderRadius: '12px', overflow: 'hidden', flexWrap: 'wrap' }}>
              {/* Left: History */}
              <div style={{ width: '220px', borderRight: '1px solid rgba(48,54,61,0.5)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                <h5 style={{ color: '#8b949e', margin: 0, fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>Request History</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px' }}>
                  {playgroundHistory.map((hist, idx) => {
                    const color = hist.method === 'GET' ? '#58a6ff' : hist.method === 'POST' ? '#3fb950' : '#d29922';
                    return (
                      <button key={idx} onClick={() => {
                        setPlaygroundMethod(hist.method);
                        setPlaygroundEndpoint(hist.endpoint);
                        setPlaygroundResponse(null);
                      }} style={{
                        padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(48,54,61,0.3)',
                        background: 'rgba(255,255,255,0.01)', textAlign: 'left', cursor: 'pointer',
                        fontSize: '0.75rem', color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <span style={{ fontWeight: '800', color, fontSize: '0.62rem', width: '28px' }}>{hist.method}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hist.endpoint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Middle: Request Builder */}
              <div style={{ flex: 1.5, padding: '20px', borderRight: '1px solid rgba(48,54,61,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: '320px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={playgroundMethod} onChange={e => setPlaygroundMethod(e.target.value)}
                      style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#e6edf3', padding: '0 12px', fontSize: '0.82rem', fontWeight: '700', outline: 'none' }}>
                      {['GET', 'POST', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div style={{ display: 'flex', flex: 1, background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', alignItems: 'center', paddingLeft: '12px' }}>
                      <span style={{ color: '#484f58', fontSize: '0.82rem', fontFamily: 'monospace' }}>/api/v1</span>
                      <input type="text" value={playgroundEndpoint} onChange={e => setPlaygroundEndpoint(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#e6edf3', padding: '8px', fontSize: '0.85rem', outline: 'none', width: '100%', fontFamily: 'monospace' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(48,54,61,0.3)', paddingBottom: '8px' }}>
                    {[
                      { id: 'params', label: 'Params' },
                      { id: 'headers', label: 'Headers' },
                      { id: 'body', label: 'Body' },
                      { id: 'auth', label: 'Auth' },
                    ].map(sub => (
                      <button key={sub.id} onClick={() => setPlaygroundActiveTab(sub.id)} style={{
                        background: 'none', border: 'none', color: playgroundActiveTab === sub.id ? '#58a6ff' : '#8b949e',
                        fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer', padding: '4px 8px',
                        borderBottom: playgroundActiveTab === sub.id ? '2px solid #58a6ff' : '2px solid transparent'
                      }}>{sub.label}</button>
                    ))}
                  </div>

                  <div style={{ minHeight: '160px' }}>
                    {playgroundActiveTab === 'params' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '600' }}>Query String Parameters</span>
                        {playgroundParams.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" value={p.key} placeholder="Key" onChange={e => {
                              const next = [...playgroundParams];
                              next[idx].key = e.target.value;
                              setPlaygroundParams(next);
                            }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                            <input type="text" value={p.value} placeholder="Value" onChange={e => {
                              const next = [...playgroundParams];
                              next[idx].value = e.target.value;
                              setPlaygroundParams(next);
                            }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {playgroundActiveTab === 'headers' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '600' }}>HTTP Request Headers</span>
                        {playgroundHeaders.map((h, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" value={h.key} placeholder="Header Key" onChange={e => {
                              const next = [...playgroundHeaders];
                              next[idx].key = e.target.value;
                              setPlaygroundHeaders(next);
                            }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                            <input type="text" value={h.value} placeholder="Value" onChange={e => {
                              const next = [...playgroundHeaders];
                              next[idx].value = e.target.value;
                              setPlaygroundHeaders(next);
                            }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {playgroundActiveTab === 'body' && (
                      <div>
                        <span style={{ color: '#8b949e', display: 'block', fontSize: '0.72rem', fontWeight: '600', marginBottom: '8px' }}>Raw JSON Payload</span>
                        <textarea value={playgroundBody} onChange={e => setPlaygroundBody(e.target.value)} rows={7}
                          style={{ width: '100%', padding: '10px', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#7ee787', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical' }} />
                      </div>
                    )}

                    {playgroundActiveTab === 'auth' && (
                      <div style={{ padding: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(48,54,61,0.3)', borderRadius: '8px' }}>
                        <span style={{ color: '#e6edf3', fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>JWT Bearer Token Auth</span>
                        <p style={{ margin: 0, color: '#8b949e', fontSize: '0.74rem', lineHeight: '1.4' }}>
                          Requests will automatically inject your user session JWT token in the <code>Authorization: Bearer</code> header.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={handlePlaygroundSend} disabled={playgroundLoading} style={{
                  width: '100%', marginTop: '16px', padding: '11px',
                  background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)',
                  color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700',
                  fontSize: '0.85rem', cursor: playgroundLoading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 16px rgba(31,111,235,0.2)'
                }}>
                  <Play size={12} fill="white" />
                  {playgroundLoading ? 'Executing Request...' : 'Send Request'}
                </button>
              </div>

              {/* Right: Response Panel */}
              <div style={{ flex: 1.8, padding: '20px', display: 'flex', flexDirection: 'column', background: 'rgba(13,17,23,0.3)', justifyContent: 'space-between', minWidth: '320px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h5 style={{ color: '#8b949e', margin: 0, fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Response Console</h5>
                    {playgroundResponse && (
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#8b949e' }}>
                        <span>Time: <strong style={{ color: '#e6edf3' }}>{playgroundLatency}</strong></span>
                        <span>Size: <strong style={{ color: '#e6edf3' }}>{playgroundPayloadSize}</strong></span>
                        <button onClick={() => handleCopy(JSON.stringify(playgroundResponse.data, null, 2))} style={{
                          background: 'none', border: 'none', color: '#58a6ff', fontSize: '0.72rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px', padding: 0
                        }}>
                          {copied ? <Check size={11} /> : <Copy size={11} />}
                          {copied ? 'Copied' : 'Copy Payload'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{
                    flex: 1, background: 'rgba(7,9,14,0.8)', border: '1px solid rgba(48,54,61,0.6)',
                    borderRadius: '8px', padding: '16px', overflowY: 'auto', maxHeight: '350px',
                    fontFamily: 'monospace', fontSize: '0.78rem', minHeight: '260px'
                  }}>
                    {playgroundResponse ? (
                      <div>
                        <div style={{ marginBottom: '12px', fontSize: '0.78rem', color: playgroundResponse.status < 400 ? '#3fb950' : '#f85149', fontWeight: '700' }}>
                          STATUS: {playgroundResponse.status} {playgroundResponse.statusText}
                        </div>
                        <pre style={{ margin: 0, color: '#e6edf3', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(playgroundResponse.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484f58' }}>
                        No execution completed.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'flow' ? (
            // ==========================================
            // END-TO-END FLOW
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ padding: '16px 20px', background: 'rgba(31,111,235,0.04)', border: '1px solid rgba(31,111,235,0.15)', borderRadius: '12px' }}>
                <p style={{ margin: 0, color: '#8b949e', fontSize: '0.8rem', lineHeight: '1.5' }}>
                  Real-time visual pathway describing how an inbound payload is received by the <strong>Universal API Gateway</strong>, processed through tenant validations, parsed via declarative mappers, and forwarded to the upstream CRM.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0', alignItems: 'center', position: 'relative' }}>
                {[
                  { title: '1. Developer Client / SDK', desc: 'PATCH /v1/crm/contacts/{id}', icon: <Code size={18} color="#58a6ff" />, bg: 'rgba(31,111,235,0.06)', border: '#388bfd' },
                  { title: '2. Edge API Gateway', desc: 'Envoy Rate limiter, CORS check, JWT Auth', icon: <Server size={18} color="#a78bfa" />, bg: 'rgba(139,92,246,0.06)', border: '#8b5cf6' },
                  { title: '3. OAuth Secret Vault & Tenancy Guard', desc: 'Isolate workspace ID, decrypt envelope credentials key', icon: <Lock size={18} color="#2ed573" />, bg: 'rgba(38,184,96,0.06)', border: '#2ed573' },
                  { title: '4. Polymorphic Mapper Engine', desc: 'Read declarative JSON-to-JSON mapping files', icon: <Compass size={18} color="#d29922" />, bg: 'rgba(255,193,7,0.06)', border: '#d29922' },
                  { title: '5. Upstream CRM Provider', desc: 'Invoke HubSpot, Salesforce, or Pipedrive API', icon: <Globe size={18} color="#f85149" />, bg: 'rgba(248,81,73,0.06)', border: '#f85149' },
                  { title: '6. Normalized Response', desc: 'Append _raw_passthrough escape hatch payload', icon: <CheckSquare size={18} color="#58a6ff" />, bg: 'rgba(31,111,235,0.06)', border: '#388bfd' },
                ].map((step, idx, arr) => (
                  <React.Fragment key={idx}>
                    <div style={{
                      width: '100%', maxWidth: '480px', background: step.bg, border: `1px solid ${step.border}3b`,
                      borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative'
                    }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(10,14,20,0.6)',
                        border: `1px solid ${step.border}6b`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {step.icon}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.88rem', fontWeight: '700' }}>{step.title}</h4>
                        <span style={{ color: '#8b949e', fontSize: '0.76rem', fontFamily: 'monospace' }}>{step.desc}</span>
                      </div>
                    </div>
                    {idx < arr.length - 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', margin: '4px 0' }}>
                        <div style={{ width: '2px', height: '20px', background: 'linear-gradient(to bottom, rgba(56,139,253,0.6), rgba(139,92,246,0.6))' }} />
                        <ChevronRight size={14} color="#8b949e" style={{ transform: 'rotate(90deg)' }} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

          ) : activeTab === 'architecture' ? (
            // ==========================================
            // SYSTEM ARCHITECTURE
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ color: '#58a6ff', margin: '0 0 12px', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>Synchronous Data Path</h4>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(88,166,255,0.15)', color: '#58a6ff', fontWeight: '700' }}>Real-Time Proxy</span>
                  <p style={{ color: '#8b949e', fontSize: '0.8rem', marginTop: '12px' }}>
                    Standard API endpoint routing directly triggers synchronous proxying:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#c9d1d9', fontFamily: 'monospace', paddingLeft: '12px', borderLeft: '2px solid rgba(88,166,255,0.3)' }}>
                    <span>Inbound HTTP call</span>
                    <span>→ Decruit tenant OAuth tokens</span>
                    <span>→ Run polymorphic mapping template</span>
                    <span>→ Fetch raw response from CRM</span>
                    <span>→ Return JSON response</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ color: '#a78bfa', margin: '0 0 12px', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>Asynchronous Sync Path</h4>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: '700' }}>Background Workers</span>
                  <p style={{ color: '#8b949e', fontSize: '0.8rem', marginTop: '12px' }}>
                    For high-volume webhooks and scheduling, operations execute via Temporal background queues:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#c9d1d9', fontFamily: 'monospace', paddingLeft: '12px', borderLeft: '2px solid rgba(139,92,246,0.3)' }}>
                    <span>Ingest webhook event in Gateway</span>
                    <span>→ Push event to RabbitMQ/Redis</span>
                    <span>→ Hand off to background sync workers</span>
                    <span>→ Sync to local DB records</span>
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'explorer' ? (
            // ==========================================
            // API NORMALIZATION EXPLORER
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: '#8b949e', fontSize: '0.82rem', fontWeight: '600' }}>Select Target Connector:</span>
                <select value={explorerProvider} onChange={e => setExplorerProvider(e.target.value)}
                  style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#e6edf3', padding: '6px 12px', fontSize: '0.82rem', outline: 'none' }}>
                  <option value="hubspot">HubSpot</option>
                  <option value="salesforce">Salesforce</option>
                  <option value="pipedrive">Pipedrive</option>
                </select>

                <span style={{ color: '#8b949e', fontSize: '0.82rem', fontWeight: '600', marginLeft: '12px' }}>Data Model Vertical:</span>
                <select value={explorerModel} onChange={e => setExplorerModel(e.target.value)}
                  style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#e6edf3', padding: '6px 12px', fontSize: '0.82rem', outline: 'none' }}>
                  <option value="contact">Contact Schema</option>
                  <option value="company">Company Schema</option>
                  <option value="deal">Deal Schema</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Left: Raw */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Raw Upstream CRM Response
                  </span>
                  <div style={{ background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.78rem', overflowX: 'auto', maxHeight: '400px' }}>
                    {explorerModel === 'contact' && explorerProvider === 'hubspot' && (
                      <pre style={{ margin: 0, color: '#ff8c42' }}>{`{
  "id": "hs_contact_101",
  "properties": {
    "firstname": "Sarah",
    "lastname": "Connor",
    "email": "sarah.connor@sky.net",
    "phone": "+1-555-0199",
    "jobtitle": "Structural Engineer"
  }
}`}</pre>
                    )}
                    {explorerModel === 'contact' && explorerProvider === 'salesforce' && (
                      <pre style={{ margin: 0, color: '#29b6e8' }}>{`{
  "Id": "sf_contact_201",
  "FirstName": "Luke",
  "LastName": "Skywalker",
  "Email": "luke@tatooine.org",
  "Phone": "+1-555-0808"
}`}</pre>
                    )}
                    {explorerModel === 'contact' && explorerProvider === 'pipedrive' && (
                      <pre style={{ margin: 0, color: '#2ed573' }}>{`{
  "id": 301,
  "name": "Anakin Skywalker",
  "email": [{ "value": "anakin@deathstar.com", "primary": true }]
}`}</pre>
                    )}
                  </div>
                </div>

                {/* Right: Normalized */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Normalized Response (Strict Mapped)
                  </span>
                  <div style={{ background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.78rem', overflowX: 'auto', maxHeight: '400px' }}>
                    {explorerModel === 'contact' && explorerProvider === 'hubspot' && (
                      <pre style={{ margin: 0, color: '#a78bfa' }}>{`{
  "id": "some-local-uuid",
  "externalId": "hs_contact_101",
  "name": "Sarah Connor",
  "email": "sarah.connor@sky.net",
  "provider": "hubspot",
  "_raw_passthrough": {
    "id": "hs_contact_101",
    "properties": {
      "firstname": "Sarah",
      "lastname": "Connor"
    }
  }
}`}</pre>
                    )}
                    {explorerModel === 'contact' && explorerProvider === 'salesforce' && (
                      <pre style={{ margin: 0, color: '#a78bfa' }}>{`{
  "id": "some-local-uuid",
  "externalId": "sf_contact_201",
  "name": "Luke Skywalker",
  "provider": "salesforce"
}`}</pre>
                    )}
                    {explorerModel === 'contact' && explorerProvider === 'pipedrive' && (
                      <pre style={{ margin: 0, color: '#a78bfa' }}>{`{
  "id": "some-local-uuid",
  "externalId": "301",
  "name": "Anakin Skywalker",
  "provider": "pipedrive"
}`}</pre>
                    )}
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'challenges' ? (
            // ==========================================
            // TECHNICAL CHALLENGES
            // ==========================================
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Tenant Data Isolation', problem: 'Ensuring that organization workspaces never leak data cross-tenant or allow unauthorized cross-company visibility.', solution: 'Enforced database-level filters based on organizationId and validated organization ID parameter claims inside signed JWT tokens.' },
                { title: 'OAuth Token Expiration', problem: 'Tokens expire asynchronously, disrupting background sync routines.', solution: 'Implemented database-level GCM envelope encryption combined with proactive background sweep loops to refresh tokens 15 minutes before expiration.' },
                { title: 'RBAC Authorization', problem: 'Lower roles accessing sensitive configuration settings, billing data, or project credentials.', solution: 'Built backend router decorators that authorize incoming calls based on strict JWT role permission checks.' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.9rem', fontWeight: '700' }}>{c.title}</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#f85149', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>The Challenge</span>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.8rem' }}>{c.problem}</p>
                  </div>
                  <div>
                    <span style={{ color: '#3fb950', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Resolution</span>
                    <p style={{ margin: 0, color: '#c9d1d9', fontSize: '0.8rem' }}>{c.solution}</p>
                  </div>
                </div>
              ))}
            </div>

          ) : activeTab === 'dx' ? (
            // ==========================================
            // DEVELOPER EXPERIENCE
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>NodeJS SDK Example</h4>
                  <pre style={{
                    margin: 0, padding: '14px', background: 'rgba(7,9,14,0.8)',
                    borderRadius: '8px', border: '1px solid rgba(48,54,61,0.5)',
                    color: '#7ee787', fontSize: '0.76rem', fontFamily: 'monospace', overflowX: 'auto'
                  }}>{`const { UniversalAPI } = require('universal-api-sdk');
const client = new UniversalAPI({ apiKey: 'your_api_token_here' });

async function run() {
  const contacts = await client.crm.getContacts({ limit: 20 });
  console.log(contacts[0]._raw_passthrough);
}
run();`}</pre>
                </div>

                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>cURL REST Request</h4>
                  <pre style={{
                    margin: 0, padding: '14px', background: 'rgba(7,9,14,0.8)',
                    borderRadius: '8px', border: '1px solid rgba(48,54,61,0.5)',
                    color: '#f0883e', fontSize: '0.76rem', fontFamily: 'monospace', overflowX: 'auto'
                  }}>{`curl -X GET \\
  "http://localhost:3000/api/v1/contacts?limit=10" \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"`}</pre>
                </div>
              </div>
            </div>

          ) : activeTab === 'roadmap' ? (
            // ==========================================
            // ROADMAP
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {[
                  { phase: 'Phase 1: CRM Sync', desc: 'HubSpot, Salesforce, Pipedrive schemas mapped. Unified contact models.', status: 'Completed', color: '#3fb950' },
                  { phase: 'Phase 2: Multi-Tenancy', desc: 'Domain-based organization workspaces, pending users approvals, strict RBAC.', status: 'Completed', color: '#3fb950' },
                  { phase: 'Phase 3: Messaging', desc: 'Integrating communication vertical with Slack, Discord, and Teams.', status: 'In Development', color: '#58a6ff' },
                  { phase: 'Phase 4: Billing & Audit', desc: 'Enterprise audit logs history and workspaces billing modules.', status: 'Planned', color: '#8b949e' },
                ].map((ph, i) => (
                  <div key={i} style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: `${ph.color}15`, color: ph.color, fontWeight: '700', alignSelf: 'flex-start' }}>{ph.status}</span>
                    <h4 style={{ margin: '4px 0 0', color: '#e6edf3', fontSize: '0.9rem', fontWeight: '700' }}>{ph.phase}</h4>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.8rem' }}>{ph.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          ) : activeTab === 'team' ? (
            // ==========================================
            // TEAM
            // ==========================================
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {[
                { name: 'Girish', roles: ['System Architecture', 'Backend Core Development', 'RBAC & Tenancy middleware'] },
                { name: 'Swayamsuchee', roles: ['CRM Connectors integration', 'Declarative Mapping JSONs', 'Adapter Pipeline transformation'] },
                { name: 'Soujanya', roles: ['Webhook Ingestion listener', 'Stateful Sync queues', 'System Unit Testing'] },
                { name: 'Aditya', roles: ['Console Dashboard UI/UX', 'Platform documentation', 'Request logs visualizer'] },
              ].map((member, idx) => (
                <div key={idx} style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: '0.98rem'
                    }}>{member.name.charAt(0)}</div>
                    <div>
                      <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.9rem', fontWeight: '700' }}>{member.name}</h4>
                      <span style={{ color: '#8b949e', fontSize: '0.74rem' }}>Module Owner</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {member.roles.map((r, i) => (
                      <span key={i} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(48,54,61,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#c9d1d9' }}>
                        • {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          ) : activeTab === 'enterprise' ? (
            // ==========================================
            // ENTERPRISE SPECS
            // ==========================================
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { title: 'Zero-Persistence Proxy', desc: 'Request and response payloads flow directly through temporary memory buffers. Credentials, tokens, and PII are scrubbed and never persistent to local disks.' },
                { title: 'Symmetric Envelope Crypt', desc: 'Secure encryption keys isolate tenant tokens using application-level envelopes. Keys are isolated dynamically.' },
                { title: 'Edge Gateways', desc: 'Global Envoy router proxying endpoints with integrated concurrency limits, CORS compliance, and DDOS mitigation.' },
              ].map((ent, i) => (
                <div key={i} style={{ padding: '16px 20px', background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px' }}>
                  <h4 style={{ color: '#58a6ff', margin: '0 0 8px', fontSize: '0.88rem', fontWeight: '700' }}>{ent.title}</h4>
                  <p style={{ margin: 0, color: '#8b949e', fontSize: '0.8rem', lineHeight: '1.5' }}>{ent.desc}</p>
                </div>
              ))}
            </div>

          ) : activeTab === 'docs' ? (
            // ==========================================
            // DOCUMENTATION
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#c9d1d9', fontSize: '0.84rem', lineHeight: '1.6' }}>
              <div>
                <h4 style={{ color: '#e6edf3', fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>Project Overview</h4>
                <p style={{ margin: 0 }}>
                  The Universal API Platform abstracts fragmentation among multiple Customer Relationship Management (CRM) databases into a single, clean REST API endpoint structure. A developer integrates this platform once, and our backend polymorphic engines translate schemas for HubSpot, Salesforce, and Pipedrive adapters transparently.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#e6edf3', fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>Envelope Security Vault</h4>
                <p style={{ margin: 0 }}>
                  We implement database-level symmetric envelope encryption using the AES-256-GCM cipher format. Every access and refresh token saved to the database is encrypted on write and decrypted on read transparently using a secure process context variable.
                </p>
              </div>
            </div>

          ) : activeTab === 'logs' ? (
            // ==========================================
            // REQUEST LOGS
            // ==========================================
            logs.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(13,17,23,0.4)' }}>
                      {['Status', 'Method', 'Endpoint', 'Time', 'Client IP', 'Errors'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(48,54,61,0.4)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const isErr = log.statusCode >= 400;
                      const methodColor = log.method === 'GET' ? '#58a6ff' : log.method === 'POST' ? '#3fb950' : '#d29922';
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)', transition: 'background 0.15s' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700',
                              background: isErr ? 'rgba(248,81,73,0.1)' : 'rgba(46,213,115,0.1)',
                              color: isErr ? '#f85149' : '#3fb950',
                              border: `1px solid ${isErr ? 'rgba(248,81,73,0.2)' : 'rgba(46,213,115,0.2)'}`
                            }}>{log.statusCode}</span>
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: '800', color: methodColor, fontSize: '0.8rem' }}>{log.method}</td>
                          <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.82rem', fontFamily: 'monospace' }}>{log.endpoint}</td>
                          <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.82rem' }}>{log.responseTime}ms</td>
                          <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.82rem' }}>{log.ipAddress || '127.0.0.1'}</td>
                          <td style={{ padding: '14px 20px', color: '#f85149', fontSize: '0.8rem' }}>{log.errorMessage || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '64px', textAlign: 'center', color: '#8b949e', fontSize: '0.88rem' }}>
                No API log records found for organization workspace.
              </div>
            )

          ) : activeTab === 'analytics' ? (
            // ==========================================
            // ANALYTICS
            // ==========================================
            analytics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(31,111,235,0.06)', border: '1px solid rgba(31,111,235,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Connected Providers</p>
                    <h3 style={{ color: '#58a6ff', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{analytics.activeConnectionsCount} <span style={{ fontSize: '0.8rem', color: '#484f58' }}>/ 4</span></h3>
                  </div>
                  <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Contacts Synced</p>
                    <h3 style={{ color: '#a78bfa', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                      {Object.values(analytics.dataDistribution?.contacts || {}).reduce((a, b) => a + b, 0)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(38,184,96,0.06)', border: '1px solid rgba(38,184,96,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Companies Synced</p>
                    <h3 style={{ color: '#2ed573', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                      {Object.values(analytics.dataDistribution?.companies || {}).reduce((a, b) => a + b, 0)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Deals Synced</p>
                    <h3 style={{ color: '#d29922', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                      {Object.values(analytics.dataDistribution?.deals || {}).reduce((a, b) => a + b, 0)}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  <div style={{ background: 'rgba(13,17,23,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>HTTP Methods & Status</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {Object.entries(analytics.requestsByMethod || {}).map(([method, count]) => {
                        const percent = Math.min(100, Math.max(5, (count / analytics.totalRequests) * 100));
                        const color = method === 'GET' ? '#58a6ff' : method === 'POST' ? '#3fb950' : '#d29922';
                        return (
                          <div key={method}>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#8b949e', marginBottom: '6px' }}>
                              <span style={{ fontWeight: '700', color }}>{method}</span>
                              <span>{count} ({Math.round(percent)}%)</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(33,38,45,0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: color, width: `${percent}%`, borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(13,17,23,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Sync Data Volume</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {['mock', 'hubspot', 'salesforce', 'pipedrive'].map((prov) => {
                        const contactCount = analytics.dataDistribution?.contacts?.[prov] || 0;
                        const companyCount = analytics.dataDistribution?.companies?.[prov] || 0;
                        const dealCount = analytics.dataDistribution?.deals?.[prov] || 0;
                        const total = contactCount + companyCount + dealCount;
                        const color = PROVIDER_COLORS[prov]?.text || '#a78bfa';
                        return (
                          <div key={prov}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#8b949e', marginBottom: '4px', textTransform: 'capitalize' }}>
                              <span style={{ fontWeight: '600', color: '#e6edf3' }}>{prov}</span>
                              <span>{contactCount} Cnt · {companyCount} Cos · {dealCount} Dls</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(33,38,45,0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: color, width: `${Math.min(100, Math.max(5, (total / 50) * 100))}%`, borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : <div style={{ padding: '64px', textAlign: 'center', color: '#8b949e' }}>No analytics data loaded.</div>

          ) : null}
        </div>

        {/* Confirm Disconnect Modal */}
        {showConfirmModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,14,20,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div style={{ background: '#0d1117', border: '1px solid rgba(248,81,73,0.4)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '1rem', fontWeight: '700' }}>Revoke connection?</h4>
              <p style={{ margin: 0, color: '#8b949e', fontSize: '0.82rem', lineHeight: '1.5' }}>
                Are you sure you want to disconnect <strong>{showConfirmModal.toUpperCase()}</strong>? This will delete all local contacts and companies synced under this provider workspace.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowConfirmModal(null)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(48,54,61,0.5)', color: '#8b949e', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDisconnect} style={{ padding: '8px 16px', background: '#f85149', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Disconnect</button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            background: toast.type === 'success' ? '#1f6feb' : toast.type === 'info' ? '#8b5cf6' : '#f85149',
            color: 'white', padding: '12px 20px', borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontSize: '0.84rem',
            fontWeight: '700', zIndex: 1002, display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <CheckCircle size={15} />
            {toast.message}
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: '56px', textAlign: 'center', borderTop: '1px solid rgba(48,54,61,0.4)', paddingTop: '28px' }}>
          <p style={{ color: '#484f58', fontSize: '0.78rem', margin: 0 }}>
            Powered by Universal API · <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer" style={{ color: '#58a6ff', textDecoration: 'none' }}>API Docs ↗</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
