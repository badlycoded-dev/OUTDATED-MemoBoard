import React, { useState, useEffect, useRef } from 'react';
import { Modal, Row, Col, Form } from 'react-bootstrap';

const PRIORITY_OPTS   = ['low', 'med', 'high'];
const PRIORITY_COLORS = { high: '#eb5a46', med: '#f5a623', low: '#70b500' };
const COVER_COLORS    = ['', '#eb5a46','#f5a623','#70b500','#0079bf','#c377e0','#00c2e0','#ff78cb','#344563','#172b4d'];
const POINTS_OPTS     = [0, 1, 2, 3, 5, 8, 13, 21];

function fmtTimer(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function CardModal({
  card, colId, colOptions, boardLabels,
  onClose, onSave, onDelete, onMove, onDuplicate,
  onTimerAction, onAddComment, onDeleteComment,
}) {
  const [form, setForm] = useState(null);
  const [newItem, setNewItem]       = useState('');
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor]         = useState(localStorage.getItem('mb_author') || 'Anonymous');
  const [activeTab, setActiveTab]   = useState('details'); // details | activity
  const [elapsed, setElapsed]       = useState(0);
  const [saving, setSaving]         = useState(false);
  const titleRef = useRef();

  // Live timer
  useEffect(() => {
    if (!card?.timerStart) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(card.timerStart)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [card?.timerStart]);

  useEffect(() => {
    if (!card) return;
    setForm({
      title:       card.title       || '',
      description: card.description || '',
      tags:        card.tags        || [],
      priority:    card.priority    || 'med',
      due:         card.due ? card.due.slice(0, 10) : '',
      assignees:   (card.assignees || []).join(', '),
      checklist:   (card.checklist || []).map(i => ({ ...i })),
      cover:       card.cover       || '',
      points:      card.points      || 0,
      completed:   card.completed   || false,
    });
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [card]);

  if (!card || !form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleLabel = (color) => {
    const tags = form.tags.includes(color)
      ? form.tags.filter(t => t !== color)
      : [...form.tags, color];
    set('tags', tags);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    set('checklist', [...form.checklist, { text: newItem.trim(), done: false }]);
    setNewItem('');
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(colId, card._id, {
      ...form,
      assignees: form.assignees.split(',').map(s => s.trim()).filter(Boolean),
      due: form.due || undefined,
    });
    setSaving(false);
    onClose();
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    localStorage.setItem('mb_author', author);
    await onAddComment(colId, card._id, newComment.trim(), author);
    setNewComment('');
  };

  const checked   = form.checklist.filter(i => i.done).length;
  const total     = form.checklist.length;
  const pct       = total ? Math.round((checked / total) * 100) : 0;
  const totalSec  = (card.timerTotal || 0) + elapsed;
  const colLabel  = colOptions.find(c => c.value === colId)?.label || '';

  return (
    <Modal show onHide={onClose} size="xl" centered dialogClassName="mb-modal">
      {/* Cover bar */}
      {form.cover && <div className="mb-modal-cover" style={{ background: form.cover }} />}

      <Modal.Header closeButton className="mb-modal-header">
        <div className="w-100">
          <input
            ref={titleRef}
            className="mb-modal-title"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
          />
          <div className="mb-modal-subtitle">
            <i className="bi bi-kanban me-1" />
            {colLabel}
            {card.completed && <span className="ms-2 mb-badge mb-badge--green">✓ Done</span>}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="mb-modal-body">
        <Row>
          {/* ── Left: main content ── */}
          <Col md={8}>

            {/* Labels */}
            {form.tags.length > 0 && (
              <div className="d-flex flex-wrap gap-1 mb-3">
                {form.tags.map((color, i) => {
                  const lbl = boardLabels?.find(l => l.color === color);
                  return (
                    <span key={i} className="mb-label-pill" style={{ background: color }}>
                      {lbl?.name || color}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Tabs */}
            <div className="mb-tabs">
              <button className={`mb-tab${activeTab === 'details' ? ' active' : ''}`} onClick={() => setActiveTab('details')}>
                <i className="bi bi-card-text me-1" />Details
              </button>
              <button className={`mb-tab${activeTab === 'activity' ? ' active' : ''}`} onClick={() => setActiveTab('activity')}>
                <i className="bi bi-activity me-1" />Activity
                {card.activity?.length > 0 && <span className="ms-1 mb-tab-count">{card.activity.length}</span>}
              </button>
            </div>

            {activeTab === 'details' && (
              <>
                {/* Description */}
                <div className="mb-section-label"><i className="bi bi-text-paragraph me-1" />Description</div>
                <Form.Control as="textarea" rows={4} value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Add a more detailed description…"
                  className="mb-textarea mb-3" />

                {/* Checklist */}
                <div className="mb-section-label d-flex align-items-center gap-2">
                  <span><i className="bi bi-check2-all me-1" />Checklist</span>
                  {total > 0 && <span className="text-muted" style={{ fontSize: 12, fontWeight: 400 }}>{pct}%</span>}
                </div>
                {total > 0 && (
                  <div className="mb-3">
                    <div className="mb-progress mb-3" style={{ height: 8 }}>
                      <div className="mb-progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#70b500' : '#0079bf', transition: 'width .3s' }} />
                    </div>
                    {form.checklist.map((item, i) => (
                      <div key={i} className="mb-checklist-row">
                        <input type="checkbox" checked={item.done}
                          onChange={() => set('checklist', form.checklist.map((it, idx) => idx === i ? { ...it, done: !it.done } : it))} />
                        <span className={item.done ? 'mb-strike' : ''}>{item.text}</span>
                        <button className="mb-remove-btn ms-auto"
                          onClick={() => set('checklist', form.checklist.filter((_, idx) => idx !== i))}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="d-flex gap-2 mb-4">
                  <input className="form-control form-control-sm" value={newItem} placeholder="Add checklist item…"
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem()} />
                  <button className="mb-btn-primary btn-sm" onClick={addItem}>Add</button>
                </div>

                {/* Comments */}
                <div className="mb-section-label"><i className="bi bi-chat-left me-1" />Comments</div>
                <div className="mb-3">
                  <div className="d-flex gap-2 mb-2">
                    <input className="form-control form-control-sm" value={author} placeholder="Your name"
                      onChange={e => setAuthor(e.target.value)} style={{ maxWidth: 130 }} />
                    <input className="form-control form-control-sm" value={newComment} placeholder="Write a comment…"
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleComment()} />
                    <button className="mb-btn-primary btn-sm" onClick={handleComment}>Post</button>
                  </div>
                  {(card.comments || []).slice().reverse().map(cmt => (
                    <div key={cmt._id} className="mb-comment">
                      <div className="mb-comment-header">
                        <strong>{cmt.author}</strong>
                        <span className="text-muted ms-2" style={{ fontSize: 11 }}>{timeAgo(cmt.createdAt)}</span>
                        <button className="mb-remove-btn ms-auto"
                          onClick={() => onDeleteComment(colId, card._id, cmt._id)}>✕</button>
                      </div>
                      <div className="mb-comment-text">{cmt.text}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'activity' && (
              <div className="mb-activity-list">
                {(card.activity || []).map((a, i) => (
                  <div key={i} className="mb-activity-row">
                    <i className="bi bi-clock-history me-2 text-muted" />
                    <span>{a.text}</span>
                    <span className="text-muted ms-auto" style={{ fontSize: 11 }}>{timeAgo(a.createdAt)}</span>
                  </div>
                ))}
                {!card.activity?.length && <div className="text-muted" style={{ fontSize: 13 }}>No activity yet.</div>}
              </div>
            )}
          </Col>

          {/* ── Right: sidebar ── */}
          <Col md={4}>
            <div className="mb-sidebar">

              {/* Mark complete */}
              <button
                className={`mb-sidebar-btn w-100 mb-2${form.completed ? ' active-green' : ''}`}
                onClick={() => set('completed', !form.completed)}
              >
                <i className={`bi ${form.completed ? 'bi-check-circle-fill' : 'bi-check-circle'} me-2`} />
                {form.completed ? 'Completed' : 'Mark complete'}
              </button>

              {/* Priority */}
              <div className="mb-sidebar-label">Priority</div>
              <div className="d-flex gap-1 mb-3">
                {PRIORITY_OPTS.map(p => (
                  <button key={p} onClick={() => set('priority', p)}
                    className={`mb-priority-btn${form.priority === p ? ' active' : ''}`}
                    style={form.priority === p ? { background: PRIORITY_COLORS[p], color: '#fff', borderColor: PRIORITY_COLORS[p] } : {}}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              {/* Labels */}
              <div className="mb-sidebar-label">Labels</div>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {(boardLabels || []).map(lbl => (
                  <button key={lbl._id} onClick={() => toggleLabel(lbl.color)}
                    className="mb-label-toggle"
                    style={{
                      background: lbl.color,
                      opacity: form.tags.includes(lbl.color) ? 1 : 0.3,
                      outline: form.tags.includes(lbl.color) ? '2px solid #172b4d' : 'none',
                    }}
                    title={lbl.name}>
                    {lbl.name || lbl.color}
                  </button>
                ))}
              </div>

              {/* Story Points */}
              <div className="mb-sidebar-label">Story Points</div>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {POINTS_OPTS.map(p => (
                  <button key={p} onClick={() => set('points', p)}
                    className={`mb-points-btn${form.points === p ? ' active' : ''}`}>
                    {p === 0 ? '—' : p}
                  </button>
                ))}
              </div>

              {/* Cover */}
              <div className="mb-sidebar-label">Cover</div>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {COVER_COLORS.map(c => (
                  <div key={c} onClick={() => set('cover', c)}
                    className="mb-cover-swatch"
                    style={{
                      background: c || '#dfe1e6',
                      outline: form.cover === c ? '2px solid #172b4d' : 'none',
                    }}
                    title={c || 'None'} />
                ))}
              </div>

              {/* Due Date */}
              <div className="mb-sidebar-label">Due Date</div>
              <Form.Control type="date" value={form.due} size="sm" className="mb-3"
                onChange={e => set('due', e.target.value)} />

              {/* Members */}
              <div className="mb-sidebar-label">Members</div>
              <input className="form-control form-control-sm mb-1" value={form.assignees}
                onChange={e => set('assignees', e.target.value)} placeholder="Alice, Bob, Carol" />
              <div className="text-muted mb-3" style={{ fontSize: 11 }}>Comma-separated names</div>

              {/* Time tracker */}
              <div className="mb-sidebar-label">Time Tracker</div>
              <div className="mb-timer-box mb-3">
                <div className="mb-timer-display">
                  {fmtTimer(totalSec)}
                  {card.timerStart && <span className="mb-timer-live">● live</span>}
                </div>
                <div className="d-flex gap-1">
                  {card.timerStart ? (
                    <button className="mb-btn-danger btn-sm flex-1" onClick={() => onTimerAction(colId, card._id, 'stop')}>
                      <i className="bi bi-stop-fill me-1" />Stop
                    </button>
                  ) : (
                    <button className="mb-btn-primary btn-sm flex-1" onClick={() => onTimerAction(colId, card._id, 'start')}>
                      <i className="bi bi-play-fill me-1" />Start
                    </button>
                  )}
                </div>
              </div>

              {/* Move to */}
              <div className="mb-sidebar-label">Move to column</div>
              <Form.Select size="sm" value={colId} className="mb-3"
                onChange={e => onMove(card._id, colId, e.target.value)}>
                {colOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Form.Select>

              {/* Actions */}
              <div className="mb-sidebar-label">Actions</div>
              <button className="mb-sidebar-btn w-100 mb-2" onClick={() => { onDuplicate(colId, card._id); onClose(); }}>
                <i className="bi bi-copy me-2" />Duplicate card
              </button>
              <button className="mb-sidebar-btn mb-sidebar-btn--danger w-100"
                onClick={() => { if (window.confirm('Delete this card?')) { onDelete(colId, card._id); onClose(); } }}>
                <i className="bi bi-trash me-2" />Delete card
              </button>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="mb-modal-footer">
        <button className="mb-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="mb-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
