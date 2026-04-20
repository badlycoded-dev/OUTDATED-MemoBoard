import React, { useState, useRef } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Dropdown } from 'react-bootstrap';
import TrelloCard from './TrelloCard';

const COL_COLORS = ['#0079bf','#70b500','#ff9f1a','#eb5a46','#c377e0','#ff78cb','#00c2e0','#51e898','#ff8ed4'];

export default function TrelloColumn({ col, onAddCard, onCardClick, onDeleteCol, onUpdateCol }) {
  const [addOpen, setAddOpen]   = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editTitle, setEditTitle] = useState(col.title);
  const textareaRef = useRef();

  const openAdd = () => {
    setAddOpen(true);
    setNewTitle('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const confirmAdd = () => {
    if (newTitle.trim()) onAddCard(col._id, { title: newTitle.trim() });
    setAddOpen(false);
  };

  const handleTitleBlur = () => {
    if (editTitle.trim() && editTitle !== col.title)
      onUpdateCol(col._id, { title: editTitle.trim() });
  };

  return (
    <div className="trello-column">
      {/* Header */}
      <div className="col-header">
        <div
          style={{ width: 12, height: 12, borderRadius: '50%', background: col.color, flexShrink: 0 }}
        />
        <input
          className="col-title-input"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
        />
        <span className="badge bg-secondary" style={{ fontSize: 11, fontWeight: 600, marginRight: 2 }}>
          {col.cards?.length || 0}
        </span>
        <Dropdown align="end">
          <Dropdown.Toggle as="button" className="col-menu-btn" style={{ border:'none' }}>
            <i className="bi bi-three-dots" />
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ fontSize: 14, minWidth: 180 }}>
            <Dropdown.Header>Change color</Dropdown.Header>
            <div className="d-flex flex-wrap gap-1 px-3 pb-2">
              {COL_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => onUpdateCol(col._id, { color: c })}
                  style={{
                    width: 22, height: 22, borderRadius: 4, background: c, cursor: 'pointer',
                    border: col.color === c ? '2px solid #172b4d' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
            <Dropdown.Divider />
            <Dropdown.Item
              className="text-danger"
              onClick={() => {
                if (window.confirm(`Delete column "${col.title}"?`)) onDeleteCol(col._id);
              }}
            >
              <i className="bi bi-trash me-2" />Delete column
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Cards */}
      <Droppable droppableId={col._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="cards-list"
            style={{
              background: snapshot.isDraggingOver ? 'rgba(9,30,66,.05)' : undefined,
              borderRadius: 6,
              padding: '4px 6px',
              minHeight: 8,
            }}
          >
            {(col.cards || []).map((card, idx) => (
              <TrelloCard
                key={card._id}
                card={card}
                colId={col._id}
                index={idx}
                onClick={() => onCardClick(card, col._id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add card */}
      {addOpen ? (
        <div className="add-card-form">
          <textarea
            ref={textareaRef}
            className="add-card-textarea"
            rows={3}
            placeholder="Enter a title for this card…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmAdd(); }
              if (e.key === 'Escape') setAddOpen(false);
            }}
          />
          <div className="d-flex align-items-center gap-2 mt-2">
            <button
              onClick={confirmAdd}
              style={{
                background: '#0079bf', color: '#fff', border: 'none',
                borderRadius: 4, padding: '6px 14px', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
              }}
            >
              Add card
            </button>
            <button
              onClick={() => setAddOpen(false)}
              style={{ background:'none', border:'none', color:'#5e6c84', fontSize:20, cursor:'pointer', lineHeight:1 }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button className="add-card-btn" onClick={openAdd}>
          <i className="bi bi-plus" />
          Add a card
        </button>
      )}
    </div>
  );
}
