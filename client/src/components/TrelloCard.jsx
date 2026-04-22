import React, { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';

const PRIORITY_COLORS = { high: '#eb5a46', med: '#f5a623', low: '#70b500' };
const AVATAR_BG       = ['#0065ff','#00875a','#ff5630','#6554c0','#0052cc','#ff9f1a'];

function dueStatus(due) {
  if (!due) return null;
  const d = new Date(due), diff = Math.ceil((d - Date.now()) / 864e5);
  const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (diff < 0)  return { label, cls: 'due-overdue' };
  if (diff <= 1) return { label, cls: 'due-soon' };
  return { label, cls: '' };
}

function fmtTimer(seconds) {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TrelloCard({ card, index, onClick, searchTerm, onToggleCollapse }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!card.timerStart) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(card.timerStart)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [card.timerStart]);

  const due      = dueStatus(card.due);
  const checked  = (card.checklist || []).filter(i => i.done).length;
  const total    = (card.checklist || []).length;
  const pct      = total ? (checked / total) * 100 : 0;
  const totalSec = (card.timerTotal || 0) + elapsed;
  const isMatch  = searchTerm && card.title.toLowerCase().includes(searchTerm.toLowerCase());
  const isDim    = searchTerm && !isMatch;

  // Note cards: show only title + minimal footer
  const isNote    = card.cardType === 'note';
  const isCompact = card.cardType === 'compact';
  const isCollapsed = card.collapsed || isCompact;

  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={[
            'mb-card',
            card.completed ? 'mb-card--done' : '',
            isDim ? 'mb-card--dim' : '',
            isMatch ? 'mb-card--match' : '',
            isNote ? 'mb-card--note' : '',
            isCollapsed ? 'mb-card--collapsed' : '',
          ].filter(Boolean).join(' ')}
          style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1 }}
          onClick={onClick}
        >
          {card.cover && !isCollapsed && (
            <div className="mb-card-cover" style={{ background: card.cover }} />
          )}

          <div className="mb-card-body">
            {card.completed && <span className="mb-card-done-badge" title="Completed">✓</span>}

            {!isCollapsed && card.tags?.length > 0 && (
              <div className="mb-card-labels">
                {card.tags.map((t, i) => (
                  <span key={i} className="mb-label" style={{ background: t }} />
                ))}
              </div>
            )}

            <div className="mb-card-title-row">
              <div className="mb-card-title">{card.title}</div>
              {/* Collapse toggle for note/task types */}
              {(isNote || card.cardType === 'task') && (
                <button
                  className="mb-card-collapse-btn"
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                  onClick={e => { e.stopPropagation(); onToggleCollapse && onToggleCollapse(card._id, !card.collapsed); }}
                >
                  <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`} />
                </button>
              )}
            </div>

            {!isCollapsed && <CardAge createdAt={card.createdAt} />}

            {/* Note card body */}
            {isNote && !isCollapsed && card.description && (
              <div className="mb-card-note-body">{card.description}</div>
            )}

            {!isCollapsed && (
              <>
                <div className="mb-card-footer">
                  {card.priority && (
                    <span className="mb-badge" style={{
                      background: PRIORITY_COLORS[card.priority] + '22',
                      color: PRIORITY_COLORS[card.priority],
                      border: `1px solid ${PRIORITY_COLORS[card.priority]}44`
                    }}>
                      {card.priority === 'high' ? '↑' : card.priority === 'low' ? '↓' : '→'} {card.priority}
                    </span>
                  )}
                  {due && <span className={`mb-badge mb-badge--due ${due.cls}`}><i className="bi bi-clock" /> {due.label}</span>}
                  {card.points > 0 && <span className="mb-badge mb-badge--points">{card.points}pt</span>}
                  {totalSec > 0 && (
                    <span className={`mb-badge${card.timerStart ? ' mb-badge--timer-live' : ''}`}>
                      <i className={`bi ${card.timerStart ? 'bi-stopwatch-fill' : 'bi-stopwatch'}`} /> {fmtTimer(totalSec)}
                    </span>
                  )}
                  {total > 0 && (
                    <span className={`mb-badge${pct === 100 ? ' mb-badge--green' : ''}`}>
                      <i className="bi bi-check2-square" /> {checked}/{total}
                    </span>
                  )}
                  {card.comments?.length > 0 && (
                    <span className="mb-badge"><i className="bi bi-chat" /> {card.comments.length}</span>
                  )}
                  {card.assignees?.length > 0 && (
                    <div className="mb-avatars ms-auto">
                      {card.assignees.slice(0, 3).map((name, i) => (
                        <div key={i} className="mb-avatar" title={name} style={{ background: AVATAR_BG[i % AVATAR_BG.length] }}>
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {card.assignees.length > 3 && <div className="mb-avatar mb-avatar--more">+{card.assignees.length - 3}</div>}
                    </div>
                  )}
                </div>
                {total > 0 && (
                  <div className="mb-progress">
                    <div className="mb-progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#70b500' : '#0079bf' }} />
                  </div>
                )}
              </>
            )}

            {/* Collapsed: show minimal badges inline */}
            {isCollapsed && (
              <div className="mb-card-footer mb-card-footer--collapsed">
                {due && <span className={`mb-badge mb-badge--due ${due.cls}`}><i className="bi bi-clock" /> {due.label}</span>}
                {total > 0 && <span className={`mb-badge${pct === 100 ? ' mb-badge--green' : ''}`}><i className="bi bi-check2-square" /> {checked}/{total}</span>}
                {card.assignees?.length > 0 && (
                  <div className="mb-avatars ms-auto">
                    <div className="mb-avatar" style={{ background: AVATAR_BG[0] }}>{card.assignees[0].slice(0,2).toUpperCase()}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function CardAge({ createdAt }) {
  if (!createdAt) return null;
  const days = Math.floor((Date.now() - new Date(createdAt)) / 864e5);
  if (days < 3) return null;
  const label = days < 7 ? `${days}d` : days < 30 ? `${Math.floor(days/7)}w` : `${Math.floor(days/30)}mo`;
  return <span className={`mb-age${days > 14 ? ' mb-age--old' : ''}`} title={`Created ${days} days ago`}>{label} old</span>;
}
