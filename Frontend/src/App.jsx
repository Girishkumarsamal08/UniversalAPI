import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Activity, CheckCircle, Smartphone } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [contacts, setContacts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/contacts/hubspot`);
      setContacts(response.data.results || []);
      setMeta(response.data.meta || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = `${API_BASE_URL}/auth/hubspot/start`;
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Unified API Dashboard</h1>
        <p style={{ color: '#8b949e', marginTop: '10px' }}>Manage all your integrations in one place</p>
      </div>

      <div className="card">
        <div className="status-row">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone color="#58a6ff" /> HubSpot Integration
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
              <p style={{ color: '#8b949e', margin: 0, fontSize: '0.9rem' }}>
                {contacts.length > 0 ? 'Connected' : 'Not Connected'}
              </p>
              {meta && (
                <span style={{ 
                  fontSize: '0.65rem', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  background: meta.mode === 'dummy_data' ? '#30363d' : '#238636',
                  color: 'white',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  letterSpacing: '0.05em'
                }}>
                  {meta.mode.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          <button className="connect-btn" onClick={handleConnect}>
            <Activity size={18} /> {contacts.length > 0 ? 'Reconnect HubSpot' : 'Connect HubSpot'}
          </button>
        </div>

        <div className="table-container">
          <div style={{ padding: '15px', borderBottom: '1px solid #30363d', background: 'rgba(48, 54, 61, 0.2)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Normalized Contacts
            </h3>
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="empty-state" style={{ color: '#f85149' }}>
              {error}
            </div>
          ) : contacts.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact, index) => (
                  <tr key={index}>
                    <td>{contact.first_name || '-'}</td>
                    <td>{contact.last_name || '-'}</td>
                    <td>{contact.email}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        background: 'rgba(56, 139, 253, 0.15)', 
                        color: '#58a6ff',
                        border: '1px solid rgba(56, 139, 253, 0.4)'
                      }}>
                        Normalized
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              No contacts found. Connect HubSpot to sync your data.
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '40px', color: '#8b949e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <CheckCircle size={14} color="#238636" /> Powered by Unified API System
      </div>
    </div>
  );
}

export default App;
