import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getWhiteboard, updateWhiteboard } from '../api/board';

const STICKY_COLORS = ['#fff9c4','#f8bbd0','#c8e6c9','#b3e5fc','#ffe0b2','#e1bee7','#ffffff'];
let nodeIdCounter = 0;

export default function Whiteboard({ boardId, boardTitle, onBack }) {
  const [nodes, setNodes]   = useState([]);
  const [view, setView]     = useState({ x: 0, y: 0, zoom: 1 });
  const [tool, setTool]     = useState('select'); // select | sticky | text | shape
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null); // { nodeId, startX, startY, origX, origY }
  const [panning, setPanning]   = useState(null); // { startX, startY, origVX, origVY }
  const [saving, setSaving]     = useState(false);
  const [editingId, setEditingId] = useState(null);
  const canvasRef = useRef();
  const saveTimer = useRef();

  useEffect(() => {
    getWhiteboard(boardId).then(wb => {
      setNodes(wb.nodes || []);
      setView({ x: wb.viewX || 0, y: wb.viewY || 0, zoom: wb.zoom || 1 });
    });
  }, [boardId]);

  const scheduleSave = useCallback((ns, v) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await updateWhiteboard(boardId, { nodes: ns, viewX: v.x, viewY: v.y, zoom: v.zoom });
      setSaving(false);
    }, 800);
  }, [boardId]);

  const updateNodes = useCallback((ns) => {
    setNodes(ns);
    scheduleSave(ns, view);
  }, [view, scheduleSave]);

  const updateView = useCallback((v) => {
    setView(v);
    scheduleSave(nodes, v);
  }, [nodes, scheduleSave]);

  const addNode = useCallback((e) => {
    if (tool === 'select') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left - view.x) / view.zoom;
    const cy = (e.clientY - rect.top  - view.y) / view.zoom;
    const id = `n${Date.now()}${nodeIdCounter++}`;
    const node = {
      _id: id, type: tool,
      x: cx - 100, y: cy - 60,
      w: tool === 'shape' ? 120 : 200,
      h: tool === 'shape' ? 120 : 120,
      content: '',
      color: tool === 'sticky' ? STICKY_COLORS[0] : tool === 'shape' ? '#0079bf' : '#ffffff',
    };
    const ns = [...nodes, node];
    updateNodes(ns);
    setSelected(id);
    setEditingId(id);
    setTool('select');
  }, [tool, view, nodes, updateNodes]);

  const startDrag = useCallback((e, nodeId) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    const node = nodes.find(n => n._id === nodeId);
    setDragging({ nodeId, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y });
    setSelected(nodeId);
  }, [tool, nodes]);

  const startPan = useCallback((e) => {
    if (tool !== 'select') { addNode(e); return; }
    if (e.target === canvasRef.current || e.target.classList.contains('wb-canvas-inner')) {
      setPanning({ startX: e.clientX, startY: e.clientY, origVX: view.x, origVY: view.y });
      setSelected(null);
    }
  }, [tool, view, addNode]);

  const onMouseMove = useCallback((e) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / view.zoom;
      const dy = (e.clientY - dragging.startY) / view.zoom;
      setNodes(ns => ns.map(n => n._id === dragging.nodeId
        ? { ...n, x: dragging.origX + dx, y: dragging.origY + dy } : n));
    } else if (panning) {
      const dx = e.clientX - panning.startX, dy = e.clientY - panning.startY;
      setView({ ...view, x: panning.origVX + dx, y: panning.origVY + dy });
    }
  }, [dragging, panning, view]);

  const onMouseUp = useCallback(() => {
    if (dragging) { scheduleSave(nodes, view); setDragging(null); }
    if (panning)  { scheduleSave(nodes, view); setPanning(null); }
  }, [dragging, panning, nodes, view, scheduleSave]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.min(3, Math.max(0.2, view.zoom * factor));
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const newX = mx - (mx - view.x) * (newZoom / view.zoom);
    const newY = my - (my - view.y) * (newZoom / view.zoom);
    updateView({ x: newX, y: newY, zoom: newZoom });
  }, [view, updateView]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const deleteNode = (id) => {
    updateNodes(nodes.filter(n => n._id !== id));
    setSelected(null);
  };

  const updateNodeContent = (id, content) => {
    const ns = nodes.map(n => n._id === id ? { ...n, content } : n);
    updateNodes(ns);
  };

  const updateNodeColor = (id, color) => {
    const ns = nodes.map(n => n._id === id ? { ...n, color } : n);
    updateNodes(ns);
  };

  const selectedNode = nodes.find(n => n._id === selected);

  return (
    <div className="wb-root">
      {/* Toolbar */}
      <div className="wb-toolbar">
        <button className="wb-back-btn" onClick={onBack}>
          <i className="bi bi-arrow-left me-1" /> Board
        </button>
        <div className="wb-toolbar-sep" />
        <span className="wb-board-name"><i className="bi bi-brush me-1" />{boardTitle} — Whiteboard</span>
        <div className="wb-toolbar-sep" />

        {[
          { id: 'select', icon: 'bi-cursor',      label: 'Select / Pan' },
          { id: 'sticky', icon: 'bi-sticky',      label: 'Add sticky note' },
          { id: 'text',   icon: 'bi-fonts',       label: 'Add text' },
          { id: 'shape',  icon: 'bi-square',      label: 'Add shape' },
        ].map(t => (
          <button key={t.id} className={`wb-tool${tool === t.id ? ' active' : ''}`}
            onClick={() => setTool(t.id)} title={t.label}>
            <i className={`bi ${t.icon}`} />
          </button>
        ))}

        <div className="wb-toolbar-sep" />
        <button className="wb-tool" onClick={() => updateView({ x: 0, y: 0, zoom: 1 })} title="Reset view">
          <i className="bi bi-fullscreen" />
        </button>
        <span className="wb-zoom-label">{Math.round(view.zoom * 100)}%</span>

        {saving && <span className="wb-saving"><i className="bi bi-cloud-upload me-1" />Saving…</span>}

        {/* Selected node controls */}
        {selectedNode && (
          <>
            <div className="wb-toolbar-sep" />
            <div className="wb-color-row">
              {(selectedNode.type === 'sticky' ? STICKY_COLORS : ['#0079bf','#eb5a46','#70b500','#c377e0','#ff9f1a','#172b4d']).map(c => (
                <div key={c} className="wb-color-dot"
                  style={{ background: c, outline: selectedNode.color === c ? '2px solid #172b4d' : 'none' }}
                  onClick={() => updateNodeColor(selected, c)} />
              ))}
            </div>
            <button className="wb-tool wb-tool--danger" onClick={() => deleteNode(selected)} title="Delete">
              <i className="bi bi-trash" />
            </button>
          </>
        )}
      </div>

      {/* Canvas */}
      <div className="wb-canvas" ref={canvasRef}
        style={{ cursor: tool === 'select' ? (panning ? 'grabbing' : 'grab') : 'crosshair' }}
        onMouseDown={startPan}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Grid background */}
        <svg className="wb-grid" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="grid" x={view.x % (20 * view.zoom)} y={view.y % (20 * view.zoom)}
              width={20 * view.zoom} height={20 * view.zoom} patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(0,0,0,0.12)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="wb-canvas-inner" style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
        }}>
          {nodes.map(node => (
            <WbNode key={node._id} node={node}
              selected={selected === node._id}
              editing={editingId === node._id}
              onMouseDown={(e) => startDrag(e, node._id)}
              onClick={(e) => { e.stopPropagation(); setSelected(node._id); }}
              onDoubleClick={(e) => { e.stopPropagation(); setEditingId(node._id); setSelected(node._id); }}
              onContentChange={(c) => updateNodeContent(node._id, c)}
              onBlur={() => setEditingId(null)}
            />
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="wb-empty">
            <i className="bi bi-brush" style={{ fontSize: 32, opacity: 0.3 }} />
            <div style={{ marginTop: 8, opacity: 0.4 }}>Click a tool above to start adding to your whiteboard</div>
          </div>
        )}
      </div>
    </div>
  );
}

function WbNode({ node, selected, editing, onMouseDown, onClick, onDoubleClick, onContentChange, onBlur }) {
  const textRef = useRef();

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [editing]);

  const baseStyle = {
    position: 'absolute',
    left: node.x, top: node.y,
    width: node.w, height: node.h,
    outline: selected ? '2px solid #0079bf' : 'none',
    outlineOffset: 2,
    userSelect: 'none',
    cursor: 'move',
  };

  if (node.type === 'shape') {
    return (
      <div style={{ ...baseStyle, background: node.color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseDown={onMouseDown} onClick={onClick} onDoubleClick={onDoubleClick}>
        {editing ? (
          <input ref={textRef} style={{ background: 'transparent', border: 'none', outline: 'none', textAlign: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14, width: '90%' }}
            value={node.content} onChange={e => onContentChange(e.target.value)} onBlur={onBlur}
            onMouseDown={e => e.stopPropagation()} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{node.content || ''}</span>
        )}
      </div>
    );
  }

  if (node.type === 'text') {
    return (
      <div style={{ ...baseStyle, background: 'transparent', minWidth: 120, minHeight: 40, height: 'auto' }}
        onMouseDown={onMouseDown} onClick={onClick} onDoubleClick={onDoubleClick}>
        {editing ? (
          <textarea ref={textRef} style={{ background: 'transparent', border: '1px dashed #0079bf', outline: 'none',
            fontSize: 15, fontWeight: 500, width: '100%', minHeight: 40, resize: 'both', fontFamily: 'inherit' }}
            value={node.content} onChange={e => onContentChange(e.target.value)} onBlur={onBlur}
            onMouseDown={e => e.stopPropagation()} />
        ) : (
          <div style={{ fontSize: 15, fontWeight: 500, color: '#172b4d', whiteSpace: 'pre-wrap', minHeight: 24 }}>
            {node.content || <span style={{ opacity: 0.3 }}>Double-click to edit</span>}
          </div>
        )}
      </div>
    );
  }

  // sticky
  return (
    <div style={{ ...baseStyle, background: node.color, borderRadius: 4,
      boxShadow: '2px 4px 12px rgba(0,0,0,.18)', padding: '8px 10px',
      display: 'flex', flexDirection: 'column' }}
      onMouseDown={onMouseDown} onClick={onClick} onDoubleClick={onDoubleClick}>
      <div style={{ height: 12, background: 'rgba(0,0,0,.08)', borderRadius: 2, marginBottom: 8, flexShrink: 0 }} />
      {editing ? (
        <textarea ref={textRef} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
          fontSize: 13, resize: 'none', fontFamily: 'inherit' }}
          value={node.content} onChange={e => onContentChange(e.target.value)} onBlur={onBlur}
          onMouseDown={e => e.stopPropagation()} />
      ) : (
        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4, overflowY: 'hidden', color: '#172b4d', whiteSpace: 'pre-wrap' }}>
          {node.content || <span style={{ opacity: 0.4 }}>Double-click to edit</span>}
        </div>
      )}
    </div>
  );
}
