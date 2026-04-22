import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import { Spinner, Alert } from 'react-bootstrap';
import { useBoard } from '../hooks/useBoard';
import { useAuth } from '../App';
import TrelloColumn from './TrelloColumn';
import CardModal from './CardModal';
import Whiteboard from './Whiteboard';

const NEW_COL_COLORS = ['#5B47FB','#FF6B6B','#FFD93D','#6BCB77','#4ECDC4','#0079bf'];
let colColorIdx = 0;

const BG_PRESETS = [
  { type:'color', value:'#5B47FB' },
  { type:'color', value:'#0067a3' },
  { type:'color', value:'#0b4870' },
  { type:'color', value:'#164424' },
  { type:'color', value:'#4a1040' },
  { type:'color', value:'#2d2d2d' },
  { type:'color', value:'#3d0000' },
  { type:'gradient', value:'linear-gradient(135deg,#5B47FB 0%,#FF6B6B 100%)' },
  { type:'gradient', value:'linear-gradient(135deg,#1a1730 0%,#5B47FB 100%)' },
  { type:'gradient', value:'linear-gradient(135deg,#0079bf 0%,#0052cc 100%)' },
  { type:'gradient', value:'linear-gradient(135deg,#164424 0%,#00875a 100%)' },
  { type:'gradient', value:'linear-gradient(135deg,#4a1040 0%,#c377e0 100%)' },
  { type:'gradient', value:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)' },
  { type:'photo', value:'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=80' },
  { type:'photo', value:'https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=80' },
  { type:'photo', value:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80' },
  { type:'photo', value:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80' },
  { type:'photo', value:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80' },
  { type:'photo', value:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80' },
];

function getBgStyle(bg) {
  if (!bg) return { backgroundColor: '#5B47FB' };
  if (bg.startsWith('linear-gradient')) return { backgroundImage: bg, backgroundSize: 'cover' };
  if (bg.startsWith('http')) return { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { backgroundColor: bg };
}

export default function BoardView() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const {
    board, loading, error,
    updateTitle, updateBoardBg,
    addColumn, updateColumn, deleteColumn,
    addCard, updateCard, duplicateCard, deleteCard, moveCard,
    timerAction, addComment, deleteComment,
  } = useBoard(boardId);

  const [activeCard, setActiveCard]     = useState(null);
  const [addColOpen, setAddColOpen]     = useState(false);
  const [newColTitle, setNewColTitle]   = useState('');
  const [editTitle, setEditTitle]       = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  // colId => show whiteboard for that specific column
  const [colWhiteboard, setColWhiteboard] = useState(null);

  // Auto-open whiteboard if ?whiteboard=1
  useEffect(() => {
    if (searchParams.get('whiteboard') === '1' && board) {
      setShowWhiteboard(true);
    }
  }, [searchParams, board]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '/') { e.preventDefault(); document.getElementById('mb-search')?.focus(); }
      if (e.key === 'Escape') { setSearchTerm(''); setShowBgPicker(false); setShowWhiteboard(false); setColWhiteboard(null); }
      if (e.key === 'n' || e.key === 'N') setAddColOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!activeCard || !board) return;
    for (const col of board.columns) {
      const card = col.cards.find(c => c._id === activeCard.card._id);
      if (card) { setActiveCard({ card, colId: col._id }); break; }
    }
  }, [board]); // eslint-disable-line

  const handleDragEnd = useCallback(async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    await moveCard(source.droppableId, draggableId, destination.droppableId, destination.index);
  }, [moveCard]);

  const handleAddCol = async () => {
    if (!newColTitle.trim()) return;
    const color = NEW_COL_COLORS[colColorIdx++ % NEW_COL_COLORS.length];
    await addColumn(newColTitle.trim(), color);
    setNewColTitle(''); setAddColOpen(false);
  };

  const handleMoveCard = async (cardId, fromColId, toColId) => {
    if (fromColId === toColId) return;
    await moveCard(fromColId, cardId, toColId, undefined);
  };

  const handleTitleBlur = async () => {
    if (editTitle.trim() && board && editTitle !== board.title) await updateTitle(editTitle);
  };

  if (loading) return (
    <div className="mb-loading">
      <Spinner animation="border" variant="light" />
      <div className="mt-2" style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>Loading board…</div>
    </div>
  );

  if (error) return (
    <div className="mb-loading">
      <Alert variant="danger" style={{ maxWidth: 480 }}>
        <strong>Cannot connect</strong>
        <div className="mt-1" style={{ fontSize: 13 }}>{error}</div>
      </Alert>
    </div>
  );

  const totalCards = board?.columns?.reduce((a, c) => a + (c.cards?.length || 0), 0) || 0;
  const colOptions = board?.columns?.map(c => ({ value: c._id, label: c.title })) || [];

  // Show column-specific whiteboard
  if (colWhiteboard) {
    const col = board.columns.find(c => c._id === colWhiteboard);
    return <Whiteboard
      boardId={boardId}
      boardTitle={`${board.title} — ${col?.title || ''}`}
      onBack={() => setColWhiteboard(null)}
    />;
  }

  if (showWhiteboard) {
    return <Whiteboard boardId={boardId} boardTitle={board.title} onBack={() => setShowWhiteboard(false)} />;
  }

  const bgStyle = getBgStyle(board.background);

  return (
    <div className="mb-wrap" style={bgStyle}>
      {board.background?.startsWith('http') && <div className="mb-bg-scrim" />}

      <div className="mb-header">
        <button className="mb-header-btn" onClick={() => navigate('/my-boards')} title="My boards">
          <i className="bi bi-grid-3x3-gap" />
        </button>
        <div className="mb-header-sep" />
        <i className="bi bi-kanban" style={{ color: '#fff', fontSize: 16 }} />
        <input
          className="mb-board-title"
          value={editTitle || (board?.title ?? '')}
          onChange={e => setEditTitle(e.target.value)}
          onFocus={() => setEditTitle(board.title)}
          onBlur={handleTitleBlur}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
          spellCheck={false}
        />
        <div className="mb-header-sep" />
        <div className="mb-search-wrap">
          <i className="bi bi-search mb-search-icon" />
          <input id="mb-search" className="mb-search-input" placeholder="Search… (/)"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearchTerm('')} />
          {searchTerm && <button className="mb-search-clear" onClick={() => setSearchTerm('')}>✕</button>}
        </div>

        <span className="mb-stat">{totalCards} cards</span>

        {/* Whiteboard */}
        <button className="mb-header-btn" onClick={() => setShowWhiteboard(true)} title="Whiteboard">
          <i className="bi bi-brush" />
        </button>

        {/* Background picker */}
        <div style={{ position: 'relative' }}>
          <button className="mb-header-btn" onClick={() => setShowBgPicker(v => !v)} title="Background">
            <i className="bi bi-image" />
          </button>
          {showBgPicker && (
            <div className="mb-bg-picker">
              <div className="mb-bg-picker-label">Colors</div>
              <div className="mb-bg-picker-row">
                {BG_PRESETS.filter(b => b.type === 'color').map(b => (
                  <div key={b.value} className="mb-bg-swatch" style={{ background: b.value,
                    outline: board.background === b.value ? '2px solid #fff' : 'none' }}
                    onClick={() => { updateBoardBg(b.value); setShowBgPicker(false); }} />
                ))}
              </div>
              <div className="mb-bg-picker-label">Gradients</div>
              <div className="mb-bg-picker-row">
                {BG_PRESETS.filter(b => b.type === 'gradient').map(b => (
                  <div key={b.value} className="mb-bg-swatch" style={{ backgroundImage: b.value,
                    outline: board.background === b.value ? '2px solid #fff' : 'none' }}
                    onClick={() => { updateBoardBg(b.value); setShowBgPicker(false); }} />
                ))}
              </div>
              <div className="mb-bg-picker-label">Photos</div>
              <div className="mb-bg-picker-row">
                {BG_PRESETS.filter(b => b.type === 'photo').map(b => (
                  <div key={b.value} className="mb-bg-swatch mb-bg-swatch--photo"
                    style={{ backgroundImage: `url(${b.value})`,
                      outline: board.background === b.value ? '2px solid #fff' : 'none' }}
                    onClick={() => { updateBoardBg(b.value); setShowBgPicker(false); }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="mb-header-avatar" onClick={() => navigate('/account')} title="Account">
          {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : (user?.name || 'U').slice(0, 2).toUpperCase()}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="mb-board-scroll">
          {board.columns?.map(col => (
            <TrelloColumn
              key={col._id}
              col={col}
              boardId={boardId}
              onAddCard={addCard}
              onCardClick={(card, colId) => setActiveCard({ card, colId })}
              onDeleteCol={deleteColumn}
              onUpdateCol={updateColumn}
              onUpdateCard={updateCard}
              onOpenWhiteboard={() => setColWhiteboard(col._id)}
              searchTerm={searchTerm}
            />
          ))}

          {addColOpen ? (
            <div className="mb-add-col-form">
              <input className="form-control mb-2" placeholder="Enter list title…"
                value={newColTitle} onChange={e => setNewColTitle(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleAddCol(); if (e.key === 'Escape') setAddColOpen(false); }} />
              <div className="d-flex gap-2">
                <button className="mb-btn-primary" onClick={handleAddCol}>Add list</button>
                <button className="mb-btn-ghost" onClick={() => setAddColOpen(false)}>✕</button>
              </div>
            </div>
          ) : (
            <button className="mb-add-col-btn" onClick={() => setAddColOpen(true)}>
              <i className="bi bi-plus" /> Add another list
            </button>
          )}
        </div>
      </DragDropContext>

      {activeCard && (
        <CardModal
          card={activeCard.card}
          colId={activeCard.colId}
          colOptions={colOptions}
          boardLabels={board.labels}
          onClose={() => setActiveCard(null)}
          onSave={updateCard}
          onDelete={deleteCard}
          onMove={handleMoveCard}
          onDuplicate={duplicateCard}
          onTimerAction={timerAction}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
        />
      )}
    </div>
  );
}
