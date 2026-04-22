import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="land-root">
      {/* Nav */}
      <nav className="land-nav">
        <div className="land-logo">
          <i className="bi bi-columns-gap" />
          <span>MemoBoard</span>
        </div>
        <div className="land-nav-links">
          {user ? (
            <button className="land-btn-primary" onClick={() => navigate('/my-boards')}>
              Go to boards <i className="bi bi-arrow-right ms-1" />
            </button>
          ) : (
            <>
              <button className="land-btn-ghost" onClick={() => navigate('/login')}>Log in</button>
              <button className="land-btn-primary" onClick={() => navigate('/register')}>Get started free</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="land-hero-badge">Better than Trello</div>
        <h1 className="land-hero-title">
          Your team's work,<br /><em>beautifully organized</em>
        </h1>
        <p className="land-hero-sub">
          MemoBoard combines kanban boards, whiteboards, and time tracking
          into one powerful workspace. Built for teams who ship.
        </p>
        <div className="land-hero-cta">
          <button className="land-btn-hero" onClick={() => navigate('/register')}>
            Start for free — no card required
          </button>
          <button className="land-btn-hero-ghost" onClick={() => navigate('/login')}>
            <i className="bi bi-play-circle me-2" />See a demo
          </button>
        </div>
        <div className="land-hero-sub-note">
          Free forever · No credit card · 5 min setup
        </div>
      </section>

      {/* Board preview mockup */}
      <section className="land-preview">
        <div className="land-preview-board">
          {[
            { title: 'To Do', color: '#7c6bfd', cards: ['Design new landing page','Write API docs','Set up CI/CD pipeline'] },
            { title: 'In Progress', color: '#FFD93D', cards: ['Implement auth flow','Fix mobile layout'] },
            { title: 'Done', color: '#6BCB77', cards: ['Database schema','Docker setup','Code review'] },
          ].map(col => (
            <div key={col.title} className="land-mock-col">
              <div className="land-mock-col-header">
                <span className="land-mock-dot" style={{ background: col.color }} />
                {col.title}
                <span className="land-mock-count">{col.cards.length}</span>
              </div>
              {col.cards.map(c => (
                <div key={c} className="land-mock-card">{c}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="land-features">
        {[
          { icon: 'bi-kanban', title: 'Kanban Boards', desc: 'Drag-and-drop task management with WIP limits, priorities, and custom labels.' },
          { icon: 'bi-brush', title: 'Whiteboards', desc: 'Freeform canvas with sticky notes, shapes, and text for brainstorming.' },
          { icon: 'bi-stopwatch', title: 'Time Tracking', desc: 'Built-in timer per card. Track time spent without leaving the board.' },
          { icon: 'bi-check2-all', title: 'Checklists', desc: 'Sub-tasks with progress bars. Know exactly how done "done" really is.' },
          { icon: 'bi-chat-left', title: 'Comments', desc: 'Discuss cards inline with timestamped comments and activity logs.' },
          { icon: 'bi-layers', title: 'MemoStacks', desc: 'Organize boards into stacks — like workspaces, but simpler.' },
        ].map(f => (
          <div key={f.title} className="land-feature-card">
            <div className="land-feature-icon"><i className={`bi ${f.icon}`} /></div>
            <div className="land-feature-title">{f.title}</div>
            <div className="land-feature-desc">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* CTA bottom */}
      <section className="land-cta-bottom">
        <h2>Ready to get organized?</h2>
        <p>Join thousands of teams using MemoBoard to ship faster.</p>
        <button className="land-btn-hero" onClick={() => navigate('/register')}>
          Create your free account
        </button>
      </section>

      {/* Footer */}
      <footer className="land-footer">
        <div className="land-logo" style={{ opacity: 0.5 }}>
          <i className="bi bi-columns-gap" /><span>MemoBoard</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
          © 2025 MemoBoard · Built with ❤️
        </div>
      </footer>
    </div>
  );
}
