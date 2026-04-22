import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards, getStacks, createBoard, deleteBoard, starBoard, createStack, deleteStack } from '../api/board';
import { useAuth } from '../App';
import AdminPanel from './AdminPanel';

const BG_PRESETS = [
  '#5B47FB','#0067a3','#0b4870','#164424','#4a1040','#2d2d2d','#3d0000',
  'linear-gradient(135deg,#5B47FB,#FF6B6B)',
  'linear-gradient(135deg,#0079bf,#0052cc)',
  'linear-gradient(135deg,#164424,#00875a)',
  'linear-gradient(135deg,#4a1040,#c377e0)',
  'linear-gradient(135deg,#1a1730,#5B47FB)',
];
const STACK_ICONS = ['📋','🚀','💡','🎯','🔧','📦','🌟','🔥','⚡','🎨'];

function getBgStyle(bg) {
  if (!bg) return { backgroundColor: '#5B47FB' };
  if (bg.startsWith('linear-gradient')) return { backgroundImage: bg };
  if (bg.startsWith('http')) return { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { backgroundColor: bg };
}

export default function HomeView() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [boards, setBoards]     = useState([]);
  const [stacks, setStacks]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBg, setNewBg]       = useState(BG_PRESETS[0]);
  const [newStack, setNewStack] = useState('');
  const [newBoardType, setNewBoardType] = useState('taskboard');
  const [showNewStack, setShowNewStack] = useState(false);
  const [newStackTitle, setNewStackTitle] = useState('');
  const [newStackIcon, setNewStackIcon]   = useState('📋');
  const [activeStack, setActiveStack]     = useState('all');
  const [search, setSearch]               = useState('');

  const reload = async () => {
    const [b, s] = await Promise.all([getBoards(), getStacks()]);
    setBoards(b); setStacks(s);
    if (s.length && !newStack) setNewStack(s[0]._id);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []); // eslint-disable-line

  const handleCreateBoard = async () => {
    if (!newTitle.trim()) return;
    const board = await createBoard({
      title: newTitle.trim(),
      background: newBg,
      memoStackId: newStack || undefined,
      boardType: newBoardType,
    });
    setNewTitle(''); setShowNew(false);
    if (newBoardType === 'whiteboard') {
      navigate(`/board/${board._id}?whiteboard=1`);
    } else {
      navigate(`/board/${board._id}`);
    }
  };

  const handleDeleteBoard = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this board?')) return;
    await deleteBoard(id);
    setBoards(bs => bs.filter(b => b._id !== id));
  };

  const handleStar = async (e, id, starred) => {
    e.stopPropagation();
    await starBoard(id, !starred);
    setBoards(bs => bs.map(b => b._id === id ? { ...b, starred: !starred } : b));
  };

  const handleCreateStack = async () => {
    if (!newStackTitle.trim()) return;
    const s = await createStack({ title: newStackTitle.trim(), icon: newStackIcon });
    setNewStackTitle(''); setShowNewStack(false);
    await reload();
    setActiveStack(s._id);
  };

  const privateStack  = stacks.find(s => s.isPrivate);
  const publicStacks  = stacks.filter(s => !s.isPrivate);
  const starredBoards = boards.filter(b => b.starred);

  let visibleBoards = activeStack === 'all' ? boards
    : activeStack === 'starred' ? starredBoards
    : boards.filter(b => b.memoStackId?.toString() === activeStack);

  if (search.trim()) {
    visibleBoards = visibleBoards.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
  }

  if (loading) return (
    <div className="mb-loading">
      <div className="home-logo" style={{ marginBottom: 12 }}><i className="bi bi-columns-gap" /><span>MemoBoard</span></div>
      <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading workspace…</div>
    </div>
  );

  return (
    <div className="home-root">
      {/* ── Sidebar ── */}
      <aside className="home-sidebar">
        <div className="home-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <i className="bi bi-columns-gap" /><span>MemoBoard</span>
        </div>

        <nav className="home-nav">
          <button className={`home-nav-item${activeStack === 'all' ? ' active' : ''}`} onClick={() => setActiveStack('all')}>
            <i className="bi bi-grid-3x3-gap" />All boards
            <span className="ms-auto home-nav-count">{boards.length}</span>
          </button>
          {starredBoards.length > 0 && (
            <button className={`home-nav-item${activeStack === 'starred' ? ' active' : ''}`} onClick={() => setActiveStack('starred')}>
              <i className="bi bi-star-fill" style={{ color: '#f5a623' }} />Starred
              <span className="ms-auto home-nav-count">{starredBoards.length}</span>
            </button>
          )}

          <div className="home-nav-section">MemoStacks</div>

          {privateStack && (
            <button className={`home-nav-item${activeStack === privateStack._id ? ' active' : ''}`}
              onClick={() => setActiveStack(privateStack._id)}>
              <span>🔒</span>{privateStack.title}
              <span className="ms-auto home-nav-count">{boards.filter(b => b.memoStackId?.toString() === privateStack._id).length}</span>
            </button>
          )}

          {publicStacks.map(s => (
            <div key={s._id} className="home-nav-stack-row">
              <button className={`home-nav-item flex-1${activeStack === s._id ? ' active' : ''}`}
                onClick={() => setActiveStack(s._id)}>
                <span>{s.icon}</span>{s.title}
                <span className="ms-auto home-nav-count">{boards.filter(b => b.memoStackId?.toString() === s._id).length}</span>
              </button>
              <button className="home-nav-stack-del" onClick={() => deleteStack(s._id).then(reload)} title="Delete">
                <i className="bi bi-x" />
              </button>
            </div>
          ))}

          {showNewStack ? (
            <div className="home-new-stack-form">
              <div className="d-flex flex-wrap gap-1 mb-1">
                {STACK_ICONS.map(ico => (
                  <button key={ico} className={`home-icon-btn${newStackIcon === ico ? ' active' : ''}`}
                    onClick={() => setNewStackIcon(ico)}>{ico}</button>
                ))}
              </div>
              <input className="form-control form-control-sm mb-1" placeholder="Stack name…"
                value={newStackTitle} onChange={e => setNewStackTitle(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleCreateStack(); if (e.key === 'Escape') setShowNewStack(false); }} />
              <div className="d-flex gap-1">
                <button className="mb-btn-primary btn-sm" onClick={handleCreateStack}>Create</button>
                <button className="mb-btn-ghost btn-sm" onClick={() => setShowNewStack(false)}>✕</button>
              </div>
            </div>
          ) : (
            <button className="home-nav-item home-nav-add" onClick={() => setShowNewStack(true)}>
              <i className="bi bi-plus-circle" />New MemoStack
            </button>
          )}
        </nav>

        <div className="home-sidebar-footer">
          <button className="home-nav-item" onClick={() => navigate('/settings')}>
            <i className="bi bi-gear" />Settings
          </button>
          <button className="home-nav-item" onClick={() => setShowAdmin(true)}>
            <i className="bi bi-shield-lock" />Admin panel
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="home-main">
        {/* Topbar */}
        <div className="home-topbar">
          <div className="home-topbar-title">
            {activeStack === 'all' ? 'All boards'
              : activeStack === 'starred' ? '⭐ Starred'
              : (() => { const s = stacks.find(s => s._id === activeStack); return s ? `${s.icon} ${s.title}` : ''; })()}
          </div>
          <div className="home-search-wrap">
            <i className="bi bi-search" />
            <input placeholder="Search boards…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="mb-btn-primary" onClick={() => setShowNew(true)}>
            <i className="bi bi-plus me-1" />New board
          </button>
          <div className="home-user-pill" onClick={() => navigate('/account')}>
            <div className="home-user-avatar">
              {user?.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : (user?.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <span className="home-user-name">{user?.nickname || user?.name}</span>
            <i className="bi bi-chevron-down" style={{ fontSize: 11, opacity: 0.5 }} />
          </div>
        </div>

        {activeStack === 'all' && !search && starredBoards.length > 0 && (
          <>
            <div className="home-section-label"><i className="bi bi-star-fill me-1" style={{ color: '#f5a623' }} />Starred</div>
            <div className="home-board-grid">
              {starredBoards.map(b => (
                <BoardCard key={b._id} board={b} stacks={stacks}
                  onClick={() => navigate(`/board/${b._id}`)}
                  onStar={e => handleStar(e, b._id, b.starred)}
                  onDelete={e => handleDeleteBoard(e, b._id)} />
              ))}
            </div>
            <div className="home-section-label mt-4"><i className="bi bi-grid me-1" />All boards</div>
          </>
        )}

        <div className="home-board-grid">
          {visibleBoards.map(b => (
            <BoardCard key={b._id} board={b} stacks={stacks}
              onClick={() => navigate(`/board/${b._id}${b.boardType === 'whiteboard' ? '?whiteboard=1' : ''}`)}
              onStar={e => handleStar(e, b._id, b.starred)}
              onDelete={e => handleDeleteBoard(e, b._id)} />
          ))}
          <div className="home-board-new" onClick={() => setShowNew(true)}>
            <i className="bi bi-plus-lg" /><span>Create new board</span>
          </div>
        </div>

        {visibleBoards.length === 0 && !search && (
          <div className="home-empty">
            <i className="bi bi-inbox" style={{ fontSize: 40, opacity: 0.15 }} />
            <div style={{ marginTop: 12, opacity: 0.4, fontSize: 15 }}>No boards here yet.</div>
            <button className="mb-btn-primary mt-3" onClick={() => setShowNew(true)}>Create first board</button>
          </div>
        )}
      </main>

      {/* New board modal */}
      {showNew && (
        <div className="home-modal-backdrop" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="home-modal">
            <div className="home-modal-preview" style={getBgStyle(newBg)}>
              <div style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, opacity: 0.95, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>
                {newTitle || 'Board title'}
              </div>
            </div>
            <div className="home-modal-body">
              <button className="home-modal-close" onClick={() => setShowNew(false)}><i className="bi bi-x-lg" /></button>

              {/* Board type */}
              <div className="mb-section-label mb-2">Board type</div>
              <div className="home-modal-type-tabs mb-3">
                <button
                  className={`home-modal-type-tab${newBoardType === 'taskboard' ? ' active' : ''}`}
                  onClick={() => setNewBoardType('taskboard')}
                >
                  <i className="bi bi-kanban" />
                  Taskboard
                </button>
                <button
                  className={`home-modal-type-tab${newBoardType === 'whiteboard' ? ' active' : ''}`}
                  onClick={() => setNewBoardType('whiteboard')}
                >
                  <i className="bi bi-brush" />
                  Whiteboard
                </button>
              </div>

              <div className="mb-section-label mb-1">Board title</div>
              <input className="form-control mb-3" placeholder="Enter board title…"
                value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateBoard()} />

              <div className="mb-section-label mb-1">Background</div>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {BG_PRESETS.map(bg => (
                  <div key={bg} style={{ width: 36, height: 36, borderRadius: 7, ...getBgStyle(bg),
                    cursor: 'pointer', outline: newBg === bg ? '3px solid var(--brand)' : 'none', outlineOffset: 2 }}
                    onClick={() => setNewBg(bg)} />
                ))}
              </div>

              <div className="mb-section-label mb-1">MemoStack</div>
              <select className="form-select form-select-sm mb-3" value={newStack} onChange={e => setNewStack(e.target.value)}>
                <option value="">— None —</option>
                {stacks.map(s => <option key={s._id} value={s._id}>{s.isPrivate ? '🔒' : s.icon} {s.title}</option>)}
              </select>

              <div className="d-flex gap-2 justify-content-end">
                <button className="mb-btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                <button className="mb-btn-primary" onClick={handleCreateBoard} disabled={!newTitle.trim()}>
                  Create {newBoardType === 'whiteboard' ? 'whiteboard' : 'board'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

function BoardCard({ board, stacks, onClick, onStar, onDelete }) {
  const stack = stacks.find(s => s._id === board.memoStackId?.toString() || s._id === board.memoStackId);
  const bgStyle = board.background?.startsWith('linear-gradient')
    ? { backgroundImage: board.background }
    : board.background?.startsWith('http')
    ? { backgroundImage: `url(${board.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: board.background || '#5B47FB' };

  return (
    <div className="home-board-card" onClick={onClick} style={bgStyle}>
      {board.background?.startsWith('http') && <div className="home-card-scrim" />}
      {board.boardType === 'whiteboard' && (
        <div className="home-board-card-type">
          <i className="bi bi-brush me-1" />whiteboard
        </div>
      )}
      <div className="home-board-card-content">
        <div className="home-board-card-title">{board.title}</div>
        {stack && <div className="home-board-card-stack">{stack.isPrivate ? '🔒' : stack.icon} {stack.title}</div>}
      </div>
      <div className="home-board-card-actions">
        <button className="home-card-btn" onClick={onStar}>
          <i className={`bi ${board.starred ? 'bi-star-fill' : 'bi-star'}`} style={{ color: board.starred ? '#f5a623' : 'rgba(255,255,255,.75)' }} />
        </button>
        <button className="home-card-btn" onClick={onDelete}>
          <i className="bi bi-trash" style={{ color: 'rgba(255,255,255,.75)' }} />
        </button>
      </div>
    </div>
  );
}
