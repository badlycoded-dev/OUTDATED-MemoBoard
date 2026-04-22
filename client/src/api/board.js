import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

// MemoStacks
export const getStacks    = ()           => api.get('/memostacks').then(r => r.data);
export const createStack  = (data)       => api.post('/memostacks', data).then(r => r.data);
export const updateStack  = (id, data)   => api.patch(`/memostacks/${id}`, data).then(r => r.data);
export const deleteStack  = (id)         => api.delete(`/memostacks/${id}`).then(r => r.data);

// Boards list
export const getBoards    = ()           => api.get('/boards').then(r => r.data);
export const createBoard  = (data)       => api.post('/boards', data).then(r => r.data);
export const deleteBoard  = (id)         => api.delete(`/boards/${id}`).then(r => r.data);
export const starBoard    = (id, v)      => api.patch(`/boards/${id}/starred`, { starred: v }).then(r => r.data);

// Single board
export const getBoard     = (id)         => api.get(`/boards/${id}`).then(r => r.data);
export const updateBoardTitle = (id, t)  => api.patch(`/boards/${id}/title`, { title: t }).then(r => r.data);
export const updateBoardBg = (id, bg)    => api.patch(`/boards/${id}/background`, { background: bg }).then(r => r.data);

// Labels
export const addLabel     = (bId, d)     => api.post(`/boards/${bId}/labels`, d).then(r => r.data);
export const updateLabel  = (bId, lId, d)=> api.patch(`/boards/${bId}/labels/${lId}`, d).then(r => r.data);
export const deleteLabel  = (bId, lId)   => api.delete(`/boards/${bId}/labels/${lId}`).then(r => r.data);

// Columns
export const addColumn    = (bId, d)     => api.post(`/boards/${bId}/columns`, d).then(r => r.data);
export const updateColumn = (bId, cId, d)=> api.patch(`/boards/${bId}/columns/${cId}`, d).then(r => r.data);
export const deleteColumn = (bId, cId)   => api.delete(`/boards/${bId}/columns/${cId}`).then(r => r.data);

// Cards
export const addCard      = (bId, cId, d)     => api.post(`/boards/${bId}/columns/${cId}/cards`, d).then(r => r.data);
export const updateCard   = (bId, cId, kId, d) => api.patch(`/boards/${bId}/columns/${cId}/cards/${kId}`, d).then(r => r.data);
export const duplicateCard= (bId, cId, kId)    => api.post(`/boards/${bId}/columns/${cId}/cards/${kId}/duplicate`).then(r => r.data);
export const deleteCard   = (bId, cId, kId)    => api.delete(`/boards/${bId}/columns/${cId}/cards/${kId}`).then(r => r.data);
export const moveCard     = (bId, cId, kId, d) => api.patch(`/boards/${bId}/columns/${cId}/cards/${kId}/move`, d).then(r => r.data);
export const timerAction  = (bId, cId, kId, a) => api.patch(`/boards/${bId}/columns/${cId}/cards/${kId}/timer`, { action: a }).then(r => r.data);
export const addComment   = (bId, cId, kId, d) => api.post(`/boards/${bId}/columns/${cId}/cards/${kId}/comments`, d).then(r => r.data);
export const deleteComment= (bId, cId, kId, cmId) => api.delete(`/boards/${bId}/columns/${cId}/cards/${kId}/comments/${cmId}`).then(r => r.data);

// Whiteboard
export const getWhiteboard    = (bId)    => api.get(`/boards/${bId}/whiteboard`).then(r => r.data);
export const updateWhiteboard = (bId, d) => api.patch(`/boards/${bId}/whiteboard`, d).then(r => r.data);

// Users & plans
export const getUsers     = ()           => api.get('/users').then(r => r.data);
export const createUser   = (d)          => api.post('/users', d).then(r => r.data);
export const updateUser   = (id, d)      => api.patch(`/users/${id}`, d).then(r => r.data);
export const deleteUser   = (id)         => api.delete(`/users/${id}`).then(r => r.data);
export const getPlans     = ()           => api.get('/plans').then(r => r.data);

// Auth
export const register   = (d)    => api.post('/auth/register', d).then(r => r.data);
export const login      = (d)    => api.post('/auth/login', d).then(r => r.data);
export const getMe      = (id)   => api.get(`/auth/me/${id}`).then(r => r.data);
export const updateMe   = (id,d) => api.patch(`/auth/me/${id}`, d).then(r => r.data);
