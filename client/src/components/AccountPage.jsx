import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { updateMe } from '../api/board';

const AVATAR_COLORS = ['#0079bf','#00875a','#eb5a46','#c377e0','#f5a623','#00c2e0','#172b4d','#6554c0'];

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, update, logout } = useAuth();

  const [form, setForm] = useState({
    name:     user?.name     || '',
    nickname: user?.nickname || '',
    email:    user?.email    || '',
    bio:      user?.bio      || '',
    avatar:   user?.avatar   || '',
  });
  const [pw, setPw]         = useState({ current: '', next: '', confirm: '' });
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState('profile');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError('');
    try {
      const updated = await updateMe(user._id, { ...form });
      update(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  const handlePasswordChange = async () => {
    if (pw.next !== pw.confirm) { setError('Passwords do not match'); return; }
    if (pw.next.length < 6)     { setError('Password must be at least 6 characters'); return; }
    setError('');
    try {
      await updateMe(user._id, { password: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  const avatarInitials = (form.name || 'U').slice(0, 2).toUpperCase();
  const avatarBg = AVATAR_COLORS[form.name.charCodeAt(0) % AVATAR_COLORS.length] || '#0079bf';

  return (
    <div className="settings-root">
      <div className="settings-sidebar">
        <button className="settings-back" onClick={() => navigate('/my-boards')}>
          <i className="bi bi-arrow-left me-2" />Back to boards
        </button>
        <div className="settings-sidebar-title">Account</div>
        {['profile','security','danger'].map(t => (
          <button key={t} className={`settings-nav-item${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            <i className={`bi ${t === 'profile' ? 'bi-person' : t === 'security' ? 'bi-shield-lock' : 'bi-exclamation-triangle'} me-2`} />
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="settings-main">
        <div className="settings-card">

          {tab === 'profile' && (
            <>
              <div className="settings-section-title">Profile</div>

              {/* Avatar */}
              <div className="settings-avatar-row">
                <div className="settings-avatar-preview" style={{ background: form.avatar ? 'transparent' : avatarBg }}>
                  {form.avatar
                    ? <img src={form.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : avatarInitials}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{form.name || 'Your Name'}</div>
                  <div style={{ color: '#5e6c84', fontSize: 13, marginBottom: 8 }}>{user?.plan || 'Free'} plan</div>
                  <div className="settings-label">Avatar URL</div>
                  <input className="form-control form-control-sm" placeholder="https://…" style={{ maxWidth: 320 }}
                    value={form.avatar} onChange={e => set('avatar', e.target.value)} />
                  <div style={{ fontSize: 11, color: '#5e6c84', marginTop: 4 }}>Or choose a color:</div>
                  <div className="d-flex gap-1 mt-1">
                    {AVATAR_COLORS.map(c => (
                      <div key={c} style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                        outline: avatarBg === c && !form.avatar ? '2px solid #172b4d' : 'none', outlineOffset: 1 }}
                        onClick={() => set('avatar', '')} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="settings-row-2">
                <div>
                  <div className="settings-label">Full name *</div>
                  <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <div className="settings-label">Nickname</div>
                  <input className="form-control" placeholder="How others see you" value={form.nickname} onChange={e => set('nickname', e.target.value)} />
                </div>
              </div>

              <div className="mb-3">
                <div className="settings-label">Email address</div>
                <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>

              <div className="mb-3">
                <div className="settings-label">Bio</div>
                <textarea className="form-control" rows={3} placeholder="A short bio…" value={form.bio} onChange={e => set('bio', e.target.value)} />
              </div>

              {error && <div className="settings-error">{error}</div>}
              {saved && <div className="settings-success"><i className="bi bi-check-circle me-1" />Changes saved!</div>}

              <div className="d-flex gap-2">
                <button className="mb-btn-primary" onClick={handleSave}>Save changes</button>
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <div className="settings-section-title">Security</div>
              <div className="mb-3">
                <div className="settings-label">New password</div>
                <input className="form-control mb-2" type="password" placeholder="New password (min 6 chars)"
                  value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
                <div className="settings-label">Confirm new password</div>
                <input className="form-control" type="password" placeholder="Repeat new password"
                  value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              {error && <div className="settings-error">{error}</div>}
              {saved && <div className="settings-success"><i className="bi bi-check-circle me-1" />Password updated!</div>}
              <button className="mb-btn-primary" onClick={handlePasswordChange}>Update password</button>
            </>
          )}

          {tab === 'danger' && (
            <>
              <div className="settings-section-title" style={{ color: '#eb5a46' }}>Danger zone</div>
              <div className="settings-danger-box">
                <div>
                  <div style={{ fontWeight: 600 }}>Log out</div>
                  <div style={{ fontSize: 13, color: '#5e6c84' }}>Sign out from this device.</div>
                </div>
                <button className="mb-btn-danger" onClick={() => { logout(); navigate('/'); }}>Log out</button>
              </div>
              <div className="settings-danger-box mt-3">
                <div>
                  <div style={{ fontWeight: 600 }}>Delete account</div>
                  <div style={{ fontSize: 13, color: '#5e6c84' }}>Permanently delete your account and all data.</div>
                </div>
                <button className="mb-btn-danger" onClick={() => window.confirm('Are you absolutely sure?') && alert('Not implemented in demo.')}>
                  Delete account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
