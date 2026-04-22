import React, { useState, useRef } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import TrelloCard from './TrelloCard';

const COL_COLORS = ['#5B47FB','#0079bf','#70b500','#ff9f1a','#eb5a46','#c377e0','#ff78cb','#00c2e0','#51e898','#ff8ed4','#344563'];

export default function TrelloColumn({ col, boardId, onAddCard, onCardClick, onDeleteCol, onUpdateCol, onUpdateCard, onOpenWhiteboard, searchTerm }) {
  const [addOpen, setAddOpen]     = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newType, setNewType]     = useState('task');
  const [editTitle, setEditTitle] = useState(col.title);
  const [collapsed, setCollapsed] = useState(false);
  const [wipEdit, setWipEdit]     = useState(false);
  const [wipVal, setWipVal]       = useState(col.wipLimit || 0);
  const textareaRef = useRef();

  const cardCount   = col.cards?.length || 0;
  const wipLimit    = col.wipLimit || 0;
  const wipExceeded = wipLimit > 0 && cardCount > wipLimit;
  const wipNear     = wipLimit > 0 && !wipExceeded && cardCount === wipLimit;

  const openAdd = () => {
    setAddOpen(true); setNewTitle('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const confirmAdd = () => {
    if (newTitle.trim()) onAddCard(col._id, { title: newTitle.trim(), cardType: newType });
    setAddOpen(false);
  };

  const handleTitleBlur = () => {
    if (editTitle.trim() && editTitle !== col.title) onUpdateCol(col._id, { title: editTitle.trim() });
  };

  const saveWip = () => {
    onUpdateCol(col._id, { wipLimit: parseInt(wipVal) || 0 });
    setWipEdit(false);
  };

  const handleToggleCollapse = (cardId, collapsed) => {
    onUpdateCard && onUpdateCard(col._id, cardId, { collapsed });
  };

  if (collapsed) {
    return (
      <div className="mb-col-collapsed" onClick={() => setCollapsed(false)} title={`${col.title} (${cardCount} cards)`}>
        <div className="mb-col-collapsed-dot" style={{ background: col.color }} />
        <span className="mb-col-collapsed-title">{col.title}</span>
        <span className="mb-col-collapsed-count">{cardCount}</span>
      </div>
    );
  }

  return (
    <div className={`mb-column${wipExceeded ? ' mb-column--wip-exceeded' : wipNear ? ' mb-column--wip-near' : ''}`}>
      {/* Header — all buttons inside this div */}
      <div className="mb-col-header">
        <div className="mb-col-dot" style={{ background: col.color }} />
        <input
          className="mb-col-title"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
        />
        {/* All action buttons grouped inside the header */}
        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          {wipLimit > 0 ? (
            <OverlayTrigger placement="top" overlay={<Tooltip>WIP limit: {wipLimit}</Tooltip>}>
              <span className={`mb-wip-badge${wipExceeded ? ' exceeded' : wipNear ? ' near' : ''}`}>
                {cardCount}/{wipLimit}
              </span>
            </OverlayTrigger>
          ) : (
            <span className="mb-count-badge">{cardCount}</span>
          )}
          <button className="mb-col-icon-btn" onClick={() => setCollapsed(true)} title="Collapse">
            <i className="bi bi-chevron-left" />
          </button>
          <Dropdown align="end">
            <Dropdown.Toggle as="button" className="mb-col-icon-btn" style={{ border: 'none' }}>
              <i className="bi bi-three-dots" />
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ fontSize: 13, minWidth: 210 }}>
              <Dropdown.Header style={{ fontSize: 11 }}>Column color</Dropdown.Header>
              <div className="d-flex flex-wrap gap-1 px-3 pb-2">
                {COL_COLORS.map(c => (
                  <div key={c} onClick={() => onUpdateCol(col._id, { color: c })}
                    style={{ width: 22, height: 22, borderRadius: 5, background: c, cursor: 'pointer',
                      outline: col.color === c ? '2px solid #1a1730' : '2px solid transparent', outlineOffset: 1 }} />
                ))}
              </div>
              <Dropdown.Divider />
              <Dropdown.Header style={{ fontSize: 11 }}>WIP limit</Dropdown.Header>
              <div className="px-3 pb-2">
                {wipEdit ? (
                  <div className="d-flex gap-1">
                    <input type="number" min="0" value={wipVal}
                      onChange={e => setWipVal(e.target.value)}
                      className="form-control form-control-sm" style={{ width: 70 }}
                      onKeyDown={e => e.key === 'Enter' && saveWip()} autoFocus />
                    <button onClick={saveWip} className="btn btn-sm btn-primary" style={{ background: 'var(--brand)', border: 'none' }}>Set</button>
                  </div>
                ) : (
                  <button onClick={() => setWipEdit(true)} className="btn btn-sm btn-outline-secondary w-100" style={{ fontSize: 12 }}>
                    {wipLimit > 0 ? `Limit: ${wipLimit} — change` : 'Set WIP limit'}
                  </button>
                )}
              </div>
              <Dropdown.Divider />
              {/* Whiteboard button for this column */}
              <Dropdown.Item onClick={() => onOpenWhiteboard && onOpenWhiteboard()}>
                <i className="bi bi-brush me-2" style={{ color: 'var(--brand)' }} />Open whiteboard
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item className="text-danger"
                onClick={() => window.confirm(`Delete "${col.title}"?`) && onDeleteCol(col._id)}>
                <i className="bi bi-trash me-2" />Delete column
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {wipExceeded && (
        <div className="mb-wip-warning">
          <i className="bi bi-exclamation-triangle-fill me-1" />
          WIP limit exceeded ({cardCount}/{wipLimit})
        </div>
      )}

      <Droppable droppableId={col._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`mb-cards-list${snapshot.isDraggingOver ? ' drag-over' : ''}`}
          >
            {(col.cards || []).map((card, idx) => (
              <TrelloCard
                key={card._id}
                card={card}
                index={idx}
                onClick={() => onCardClick(card, col._id)}
                searchTerm={searchTerm}
                onToggleCollapse={handleToggleCollapse}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add card footer — stays inside column */}
      <div className="mb-col-footer">
        {addOpen ? (
          <div className="mb-add-card-form">
            <textarea ref={textareaRef} className="mb-add-card-input" rows={3}
              placeholder="Enter a title…"
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmAdd(); }
                if (e.key === 'Escape') setAddOpen(false);
              }} />
            <div className="mb-add-card-type-row">
              {['task','note','compact'].map(t => (
                <button key={t}
                  className={`mb-type-btn${newType === t ? ' active' : ''}`}
                  onClick={() => setNewType(t)}>
                  {t === 'task' ? '☑ Task' : t === 'note' ? '📝 Note' : '⬜ Compact'}
                </button>
              ))}
            </div>
            <div className="mb-add-card-actions">
              <button className="mb-btn-primary" onClick={confirmAdd}>Add card</button>
              <button className="mb-btn-ghost" onClick={() => setAddOpen(false)}>✕</button>
            </div>
          </div>
        ) : (
          <button className="mb-add-card-btn" onClick={openAdd}>
            <i className="bi bi-plus" /> Add a card
          </button>
        )}
      </div>
    </div>
  );
}
