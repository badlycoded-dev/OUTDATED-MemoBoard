import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge, Row, Col } from 'react-bootstrap';

const TAGS_OPTIONS = ['design','dev','research','urgent'];
const PRIORITY_OPTIONS = ['low','med','high'];
const PRIORITY_COLORS  = { high:'#bf2600', med:'#f5a623', low:'#70b500' };

export default function CardModal({ card, colId, colOptions, onClose, onSave, onDelete, onMove }) {
  const [form, setForm] = useState({
    title:       '',
    description: '',
    tags:        [],
    priority:    'med',
    due:         '',
    assignees:   '',
    checklist:   [],
  });
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (!card) return;
    setForm({
      title:       card.title       || '',
      description: card.description || '',
      tags:        card.tags        || [],
      priority:    card.priority    || 'med',
      due:         card.due ? card.due.slice(0,10) : '',
      assignees:   (card.assignees || []).join(', '),
      checklist:   (card.checklist || []).map(i => ({ ...i })),
    });
  }, [card]);

  if (!card) return null;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleTag = (t) =>
    set('tags', form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);

  const addItem = () => {
    if (!newItem.trim()) return;
    set('checklist', [...form.checklist, { text: newItem.trim(), done: false }]);
    setNewItem('');
  };

  const toggleItem = (i) =>
    set('checklist', form.checklist.map((it, idx) => idx === i ? { ...it, done: !it.done } : it));

  const removeItem = (i) =>
    set('checklist', form.checklist.filter((_, idx) => idx !== i));

  const handleSave = () => {
    onSave(colId, card._id, {
      ...form,
      assignees: form.assignees.split(',').map(s => s.trim()).filter(Boolean),
      due:       form.due || undefined,
    });
  };

  const checkedCount = form.checklist.filter(i => i.done).length;
  const totalCount   = form.checklist.length;

  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <div style={{ width: '100%' }}>
          <Form.Control
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Card title"
            style={{ fontWeight: 700, fontSize: 16, border:'none', padding:'0 4px', boxShadow:'none' }}
          />
          <small className="text-muted" style={{ paddingLeft: 4 }}>
            in column <strong>{colOptions.find(c => c.value === colId)?.label}</strong>
          </small>
        </div>
      </Modal.Header>

      <Modal.Body>
        <Row>
          {/* Left column */}
          <Col md={8}>

            {/* Description */}
            <div className="modal-section-label">Description</div>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Add a more detailed description…"
              className="mb-3"
            />

            {/* Checklist */}
            <div className="modal-section-label">
              Checklist
              {totalCount > 0 && (
                <span className="ms-2 text-secondary" style={{ fontWeight: 400, fontSize: 12 }}>
                  {checkedCount}/{totalCount}
                </span>
              )}
            </div>
            {totalCount > 0 && (
              <div className="mb-2">
                <div className="card-checklist-bar" style={{ height: 8, marginBottom: 8 }}>
                  <div
                    className={`checklist-fill${checkedCount === totalCount ? ' complete' : ''}`}
                    style={{ width: `${(checkedCount/totalCount)*100}%` }}
                  />
                </div>
                {form.checklist.map((item, i) => (
                  <div key={i} className="checklist-item-row">
                    <input type="checkbox" checked={item.done} onChange={() => toggleItem(i)} />
                    <span className={item.done ? 'done-text' : ''}>{item.text}</span>
                    <button
                      onClick={() => removeItem(i)}
                      style={{ marginLeft:'auto', background:'none', border:'none', color:'#5e6c84', cursor:'pointer', padding:'0 4px' }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="d-flex gap-2 mb-3">
              <Form.Control
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder="Add an item…"
                onKeyDown={e => e.key === 'Enter' && addItem()}
                size="sm"
              />
              <Button variant="outline-secondary" size="sm" onClick={addItem}>Add</Button>
            </div>

          </Col>

          {/* Right column – metadata */}
          <Col md={4}>

            {/* Priority */}
            <div className="modal-section-label">Priority</div>
            <div className="d-flex gap-1 mb-3">
              {PRIORITY_OPTIONS.map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={form.priority === p ? 'dark' : 'outline-secondary'}
                  style={form.priority === p ? { background: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] } : {}}
                  onClick={() => set('priority', p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </div>

            {/* Tags */}
            <div className="modal-section-label">Labels</div>
            <div className="d-flex flex-wrap gap-1 mb-3">
              {TAGS_OPTIONS.map(t => (
                <Badge
                  key={t}
                  bg="none"
                  className={`card-tag tag-${t}`}
                  style={{ cursor:'pointer', opacity: form.tags.includes(t) ? 1 : 0.4, userSelect:'none', fontSize:12 }}
                  onClick={() => toggleTag(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Badge>
              ))}
            </div>

            {/* Due date */}
            <div className="modal-section-label">Due Date</div>
            <Form.Control
              type="date"
              value={form.due}
              onChange={e => set('due', e.target.value)}
              size="sm"
              className="mb-3"
            />

            {/* Assignees */}
            <div className="modal-section-label">Members</div>
            <Form.Control
              value={form.assignees}
              onChange={e => set('assignees', e.target.value)}
              placeholder="Alice, Bob, Carol"
              size="sm"
              className="mb-3"
            />
            <Form.Text className="text-muted">Comma-separated names</Form.Text>

            {/* Move to column */}
            <div className="modal-section-label mt-3">Move to</div>
            <Form.Select
              size="sm"
              value={colId}
              onChange={e => onMove(card._id, colId, e.target.value)}
            >
              {colOptions.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Form.Select>

          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => { onDelete(colId, card._id); onClose(); }}
        >
          <i className="bi bi-trash me-1" />Delete card
        </Button>
        <div className="ms-auto d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            style={{ background: '#0079bf', borderColor: '#0079bf' }}
            onClick={() => { handleSave(); onClose(); }}
          >
            Save changes
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
