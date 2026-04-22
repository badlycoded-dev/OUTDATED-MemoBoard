import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin, register as apiRegister } from '../api/board';
import { useAuth } from '../App';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isReg = mode === 'register';

  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = isReg
        ? await apiRegister(form)
        : await apiLogin({ email: form.email, password: form.password });
      login(user);
      navigate('/my-boards');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="auth-root">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="land-logo mb-4" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <i className="bi bi-columns-gap" /><span>MemoBoard</span>
          </div>
          <h1 className="auth-title">{isReg ? 'Create your account' : 'Welcome back'}</h1>
          <p className="auth-sub">{isReg ? 'Free forever. No credit card needed.' : 'Log in to your workspace.'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isReg && (
              <div className="auth-field">
                <label>Full name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Jane Smith" required autoFocus />
              </div>
            )}
            <div className="auth-field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="jane@example.com" required autoFocus={!isReg} />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••••" minLength={isReg ? 6 : 0} />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait…' : isReg ? 'Create account' : 'Log in'}
            </button>
          </form>

          <div className="auth-switch">
            {isReg ? <>Already have an account? <Link to="/login">Log in</Link></> : <>No account? <Link to="/register">Sign up free</Link></>}
          </div>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div className="auth-right">
        <div className="auth-right-inner">
          <div className="auth-quote">
            "MemoBoard replaced Trello, Notion, and our whiteboard app in one shot."
          </div>
          <div className="auth-quote-author">— Engineering team lead</div>
          <div className="auth-mock-board">
            {['Backlog','In Progress','Done'].map((t,i) => (
              <div key={t} className="auth-mock-col">
                <div className="auth-mock-col-title">{t}</div>
                {Array(i===0?3:i===1?2:2).fill(0).map((_,j) => (
                  <div key={j} className="auth-mock-card" style={{ opacity: 1 - j*0.2 }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
