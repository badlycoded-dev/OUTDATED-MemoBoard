import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/board';

export function useBoard() {
  const [board, setBoard]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.getBoard();
      setBoard(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const withRefresh = (fn) => async (...args) => {
    try { const { data } = await fn(...args); setBoard(data); }
    catch (e) { setError(e.message); }
  };

  return {
    board, loading, error, refresh,
    updateTitle:  withRefresh((t)           => api.updateBoardTitle(t)),
    addColumn:    withRefresh((t, c)        => api.addColumn(t, c)),
    updateColumn: withRefresh((cId, d)      => api.updateColumn(cId, d)),
    deleteColumn: withRefresh((cId)         => api.deleteColumn(cId)),
    addCard:      withRefresh((cId, d)      => api.addCard(cId, d)),
    updateCard:   withRefresh((cId, kId, d) => api.updateCard(cId, kId, d)),
    deleteCard:   withRefresh((cId, kId)    => api.deleteCard(cId, kId)),
    moveCard:     withRefresh((cId, kId, tCId, tIdx) => api.moveCard(cId, kId, tCId, tIdx)),
  };
}
