import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

const TAG_CLASSES = { design:'tag-design', dev:'tag-dev', research:'tag-research', urgent:'tag-urgent' };
const PRIORITY_STRIPE = { high:'priority-high', med:'priority-med', low:'priority-low' };
const AVATAR_COLORS   = ['#0065ff','#00875a','#ff5630','#6554c0','#0052cc','#253858'];

function dueStatus(due) {
  if (!due) return null;
  const d     = new Date(due);
  const today = new Date();
  const diff  = Math.ceil((d - today) / 864e5);
  const label = d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
  if (diff < 0) return { label, cls:'overdue' };
  if (diff <= 2) return { label, cls:'soon' };
  return { label, cls:'' };
}

export default function TrelloCard({ card, colId, index, onClick }) {
  const due      = dueStatus(card.due);
  const checked  = card.checklist?.filter(i => i.done).length || 0;
  const total    = card.checklist?.length || 0;
  const pct      = total ? (checked / total) * 100 : 0;
  const complete = pct === 100;

  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="trello-card"
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging
              ? '0 8px 24px rgba(9,30,66,.25)'
              : undefined,
          }}
          onClick={onClick}
        >
          {/* Priority stripe */}
          {card.priority && <div className={`card-stripe ${PRIORITY_STRIPE[card.priority]}`} />}

          {/* Tags */}
          {card.tags?.length > 0 && (
            <div className="card-tags" style={{ paddingLeft: card.priority ? 8 : 0 }}>
              {card.tags.map(t => (
                <span key={t} className={`card-tag ${TAG_CLASSES[t] || ''}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              ))}
            </div>
          )}

          <div className="card-title" style={{ paddingLeft: card.priority ? 8 : 0 }}>
            {card.title}
          </div>

          {/* Footer row */}
          {(due || total > 0 || card.assignees?.length > 0) && (
            <div className="card-footer" style={{ paddingLeft: card.priority ? 8 : 0 }}>
              {due && (
                <span className={`card-meta-pill ${due.cls}`}>
                  <i className="bi bi-clock" style={{ fontSize: 11 }} />
                  {due.label}
                </span>
              )}

              {total > 0 && (
                <>
                  <span className="card-meta-pill" style={{ gap: 4, padding: '2px 0' }}>
                    <i className="bi bi-check2-square" style={{ fontSize: 11 }} />
                    {checked}/{total}
                  </span>
                  <div className="card-checklist-bar">
                    <div
                      className={`checklist-fill${complete ? ' complete' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </>
              )}

              {card.assignees?.length > 0 && (
                <div className="card-avatars">
                  {card.assignees.slice(0, 4).map((name, i) => (
                    <div
                      key={i}
                      className="card-avatar"
                      title={name}
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
