import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Spinner, Alert } from 'react-bootstrap';
import { useBoard } from './hooks/useBoard';
import TrelloColumn from './components/TrelloColumn';
import CardModal from './components/CardModal';

const NEW_COL_COLORS = ['#0079bf','#70b500','#ff9f1a','#eb5a46','#c377e0'];
let colColorIdx = 0;

export default function App() {
  const {
    board, loading, error,
    updateTitle, addColumn, updateColumn, deleteColumn,
    addCard, updateCard, deleteCard, moveCard,
  } = useBoard();

  const [activeCard, setActiveCard] = useState(null);  // { card, colId }
  const [addColOpen, setAddColOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    await moveCard(source.droppableId, draggableId, destination.droppableId, destination.index);
  };

  const handleAddCol = async () => {
    if (!newColTitle.trim()) return;
    const color = NEW_COL_COLORS[colColorIdx % NEW_COL_COLORS.length];
    colColorIdx++;
    await addColumn(newColTitle.trim(), color);
    setNewColTitle('');
    setAddColOpen(false);
  };

  const handleMoveCard = async (cardId, fromColId, toColId) => {
    if (fromColId === toColId) return;
    await moveCard(fromColId, cardId, toColId, undefined);
    setActiveCard(prev => prev ? { ...prev, colId: toColId } : null);
  };

  const handleTitleBlur = async () => {
    if (editTitle.trim() && editTitle !== board.title) await updateTitle(editTitle);
  };

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background:'#0067a3' }}>
      <Spinner animation="border" variant="light" />
    </div>
  );

  if (error) return (
    <div className="p-4" style={{ background:'#0067a3', minHeight:'100vh' }}>
      <Alert variant="danger">
        <strong>Connection error:</strong> {error}
        <div className="mt-1 text-muted" style={{ fontSize:13 }}>
          Make sure the server is running on <code>localhost:5000</code> and MongoDB is connected.
        </div>
      </Alert>
    </div>
  );

  const colOptions = board.columns.map(c => ({ value: c._id, label: c.title }));

  return (
    <div className="board-wrap">
      {/* Header */}
      <div className="board-header">
        <i className="bi bi-kanban" style={{ color:'#fff', fontSize:20 }} />
        <input
          className="board-title-input"
          value={editTitle || board.title}
          onChange={e => setEditTitle(e.target.value)}
          onFocus={() => setEditTitle(board.title)}
          onBlur={handleTitleBlur}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
        />
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <span style={{ color:'rgba(255,255,255,.7)', fontSize:13 }}>
            {board.columns?.reduce((a,c) => a + (c.cards?.length||0), 0)} cards
          </span>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="columns-scroll">
          {board.columns?.map(col => (
            <TrelloColumn
              key={col._id}
              col={col}
              onAddCard={(colId, data) => addCard(colId, data)}
              onCardClick={(card, colId) => setActiveCard({ card, colId })}
              onDeleteCol={deleteColumn}
              onUpdateCol={updateColumn}
            />
          ))}

          {/* Add column */}
          {addColOpen ? (
            <div style={{
              background: '#ebecf0', borderRadius: 10, width: 272, flexShrink: 0,
              padding: 10, alignSelf: 'flex-start',
            }}>
              <input
                className="form-control mb-2"
                placeholder="Enter list title…"
                value={newColTitle}
                onChange={e => setNewColTitle(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCol();
                  if (e.key === 'Escape') setAddColOpen(false);
                }}
                style={{ fontSize:14 }}
              />
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={handleAddCol}
                  style={{
                    background:'#0079bf', color:'#fff', border:'none',
                    borderRadius:4, padding:'6px 14px', fontWeight:600, fontSize:14, cursor:'pointer',
                  }}
                >
                  Add list
                </button>
                <button
                  onClick={() => setAddColOpen(false)}
                  style={{ background:'none', border:'none', color:'#5e6c84', fontSize:20, cursor:'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button className="add-column-btn" onClick={() => setAddColOpen(true)}>
              <i className="bi bi-plus" />
              Add another list
            </button>
          )}
        </div>
      </DragDropContext>

      {/* Card Modal */}
      {activeCard && (
        <CardModal
          card={activeCard.card}
          colId={activeCard.colId}
          colOptions={colOptions}
          onClose={() => setActiveCard(null)}
          onSave={updateCard}
          onDelete={deleteCard}
          onMove={handleMoveCard}
        />
      )}
    </div>
  );
}
