import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/board';

export function useBoard(boardId) {
  const [board, setBoard]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    if (!boardId) return;
    try {
      setLoading(true); setError(null);
      setBoard(await api.getBoard(boardId));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [boardId]);

  useEffect(() => { load(); }, [load]);

  const wrap = (fn) => async (...args) => {
    try { setBoard(await fn(...args)); } catch (e) { setError(e.message); }
  };

  return {
    board, loading, error, reload: load,
    updateTitle:   wrap((t)           => api.updateBoardTitle(boardId, t)),
    updateBoardBg: wrap((bg)          => api.updateBoardBg(boardId, bg)),
    addLabel:      wrap((d)           => api.addLabel(boardId, d)),
    updateLabel:   wrap((lId, d)      => api.updateLabel(boardId, lId, d)),
    deleteLabel:   wrap((lId)         => api.deleteLabel(boardId, lId)),
    addColumn:     wrap((t, c)        => api.addColumn(boardId, { title: t, color: c })),
    updateColumn:  wrap((cId, d)      => api.updateColumn(boardId, cId, d)),
    deleteColumn:  wrap((cId)         => api.deleteColumn(boardId, cId)),
    addCard:       wrap((cId, d)      => api.addCard(boardId, cId, d)),
    updateCard:    wrap((cId, kId, d) => api.updateCard(boardId, cId, kId, d)),
    duplicateCard: wrap((cId, kId)    => api.duplicateCard(boardId, cId, kId)),
    deleteCard:    wrap((cId, kId)    => api.deleteCard(boardId, cId, kId)),
    moveCard:      wrap((cId, kId, tId, idx) => api.moveCard(boardId, cId, kId, { toColId: tId, toIndex: idx })),
    timerAction:   wrap((cId, kId, a) => api.timerAction(boardId, cId, kId, a)),
    addComment:    wrap((cId, kId, d) => api.addComment(boardId, cId, kId, d)),
    deleteComment: wrap((cId, kId, cmId) => api.deleteComment(boardId, cId, kId, cmId)),
  };
}
