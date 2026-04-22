import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { updateMe } from '../api/board';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, update } = useAuth();
  const [tab, setTab]    = useState('appearance');
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    theme:       user?.theme       || 'system',
    language:    user?.language    || 'en',
    emailNotify: user?.emailNotify ?? true,
  });

  const set = (k, v) => setPrefs(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const updated = await updateMe(user._id, prefs);
    update(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TABS = [
    { id: 'appearance', label: 'Appearance', icon: 'bi-palette' },
    { id: 'notifications', label: 'Notifications', icon: 'bi-bell' },
    { id: 'language', label: 'Language', icon: 'bi-translate' },
    { id: 'about', label: 'About', icon: 'bi-info-circle' },
  ];

  return (
    <div className="settings-root">
      <div className="settings-sidebar">
        <button className="settings-back" onClick={() => navigate('/my-boards')}>
          <i className="bi bi-arrow-left me-2" />Back to boards
        </button>
        <div className="settings-sidebar-title">Settings</div>
        {TABS.map(t => (
          <button key={t.id} className={`settings-nav-item${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`bi ${t.icon} me-2`} />{t.label}
          </button>
        ))}
        <div className="settings-sidebar-footer">
          <button className="settings-nav-item" onClick={() => navigate('/account')}>
            <i className="bi bi-person me-2" />Account
          </button>
        </div>
      </div>

      <div className="settings-main">
        <div className="settings-card">
          {tab === 'appearance' && (
            <>
              <div className="settings-section-title">Appearance</div>
              <div className="settings-label">Theme</div>
              <div className="settings-theme-grid">
                {['light','dark','system'].map(t => (
                  <button key={t} className={`settings-theme-btn${prefs.theme === t ? ' active' : ''}`}
                    onClick={() => set('theme', t)}>
                    <div className={`settings-theme-preview theme-${t}`}>
                      <div className="stp-header" />
                      <div className="stp-body">
                        <div className="stp-col" /><div className="stp-col" /><div className="stp-col" />
                      </div>
                    </div>
                    <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                    {prefs.theme === t && <i className="bi bi-check-circle-fill" style={{ color: '#0079bf', fontSize: 14 }} />}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <div className="settings-section-title">Notifications</div>
              {[
                { key: 'emailNotify', label: 'Email notifications', desc: 'Receive updates about your boards via email.' },
              ].map(item => (
                <div key={item.key} className="settings-toggle-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: '#5e6c84' }}>{item.desc}</div>
                  </div>
                  <button
                    className={`settings-toggle${prefs[item.key] ? ' on' : ''}`}
                    onClick={() => set(item.key, !prefs[item.key])}>
                    <div className="settings-toggle-knob" />
                  </button>
                </div>
              ))}
            </>
          )}

          {tab === 'language' && (
            <>
              <div className="settings-section-title">Language & Region</div>
              <div className="settings-label">Interface language</div>
              <select className="form-select mb-3" style={{ maxWidth: 280 }}
                value={prefs.language} onChange={e => set('language', e.target.value)}>
                {[['en','English'],['uk','Ukrainian'],['de','German'],['fr','French'],['es','Spanish'],['ja','Japanese']].map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </>
          )}

          {tab === 'about' && (
            <>
              <div className="settings-section-title">About MemoBoard</div>
              <div className="settings-about-logo">
                <i className="bi bi-columns-gap" /><span>MemoBoard</span>
              </div>
              <div style={{ fontSize: 13, color: '#5e6c84', lineHeight: 1.7 }}>
                <div><strong>Version:</strong> 2.0.0</div>
                <div><strong>Stack:</strong> Node.js · Express · MongoDB · React · Bootstrap</div>
                <div><strong>License:</strong> MIT</div>
              </div>
              <div className="settings-about-features">
                {['Kanban boards','Whiteboards','Time tracking','Comments & activity','WIP limits','MemoStacks','Custom labels','Story points'].map(f => (
                  <div key={f} className="settings-feature-tag"><i className="bi bi-check2 me-1" />{f}</div>
                ))}
              </div>
            </>
          )}

          {tab !== 'about' && (
            <div className="d-flex align-items-center gap-3 mt-4">
              <button className="mb-btn-primary" onClick={handleSave}>Save preferences</button>
              {saved && <span style={{ color: '#00875a', fontSize: 13 }}><i className="bi bi-check-circle me-1" />Saved!</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
