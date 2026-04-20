import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getBoard          = ()                          => api.get('/board');
export const updateBoardTitle  = (title)                     => api.patch('/board/title', { title });

export const addColumn         = (title, color)              => api.post('/board/columns', { title, color });
export const updateColumn      = (colId, data)               => api.patch(`/board/columns/${colId}`, data);
export const deleteColumn      = (colId)                     => api.delete(`/board/columns/${colId}`);

export const addCard           = (colId, data)               => api.post(`/board/columns/${colId}/cards`, data);
export const updateCard        = (colId, cardId, data)       => api.patch(`/board/columns/${colId}/cards/${cardId}`, data);
export const deleteCard        = (colId, cardId)             => api.delete(`/board/columns/${colId}/cards/${cardId}`);
export const moveCard          = (colId, cardId, toColId, toIndex) =>
  api.patch(`/board/columns/${colId}/cards/${cardId}/move`, { toColId, toIndex });
