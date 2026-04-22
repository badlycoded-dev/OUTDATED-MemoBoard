const express = require('express');
const router  = express.Router();
const { Board, MemoStack, User, PLANS } = require('./models');

const findCol  = (board, colId)  => board.columns.id(colId);
const findCard = (col, cardId)   => col?.cards.id(cardId);
const logActivity = (card, text) => {
  card.activity.unshift({ text });
  if (card.activity.length > 50) card.activity = card.activity.slice(0, 50);
};

// ── Seed helper ────────────────────────────────────────
async function ensureDefaults() {
  let privateStack = await MemoStack.findOne({ isPrivate: true });
  if (!privateStack) {
    privateStack = await MemoStack.create({ title: 'Private', color: '#172b4d', icon: '🔒', isPrivate: true, order: 0 });
  }
  const count = await Board.countDocuments();
  if (!count) {
    await Board.create({
      title: 'My First Board',
      background: '#0067a3',
      memoStackId: privateStack._id,
      labels: [
        { name: 'Design', color: '#00c2e0' },
        { name: 'Dev',    color: '#0079bf' },
        { name: 'Urgent', color: '#eb5a46' },
      ],
      columns: [
        { title: 'To Do',       color: '#0079bf', order: 0 },
        { title: 'In Progress', color: '#e6a817', order: 1 },
        { title: 'Done',        color: '#70b500', order: 2 },
      ],
    });
  }
  return privateStack;
}

// ── MemoStacks ─────────────────────────────────────────
router.get('/memostacks', async (req, res) => {
  try {
    await ensureDefaults();
    const stacks = await MemoStack.find().sort('order');
    res.json(stacks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/memostacks', async (req, res) => {
  try {
    const count = await MemoStack.countDocuments();
    const stack = await MemoStack.create({ ...req.body, isPrivate: false, order: count });
    res.status(201).json(stack);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/memostacks/:id', async (req, res) => {
  try {
    const stack = await MemoStack.findById(req.params.id);
    if (!stack) return res.status(404).json({ error: 'Not found' });
    if (stack.isPrivate && req.body.isPrivate === false) return res.status(403).json({ error: 'Cannot make Private stack public' });
    ['title','color','icon','order'].forEach(f => { if (req.body[f] !== undefined) stack[f] = req.body[f]; });
    await stack.save();
    res.json(stack);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/memostacks/:id', async (req, res) => {
  try {
    const stack = await MemoStack.findById(req.params.id);
    if (!stack) return res.status(404).json({ error: 'Not found' });
    if (stack.isPrivate) return res.status(403).json({ error: 'Cannot delete Private stack' });
    await MemoStack.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Boards list ────────────────────────────────────────
router.get('/boards', async (req, res) => {
  try {
    await ensureDefaults();
    const boards = await Board.find({}, 'title background starred description memoStackId createdAt updatedAt');
    res.json(boards);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/boards', async (req, res) => {
  try {
    const board = await Board.create({
      title:       req.body.title || 'New Board',
      background:  req.body.background || '#0067a3',
      memoStackId: req.body.memoStackId,
      description: req.body.description || '',
      labels: [
        { name: 'Design', color: '#00c2e0' },
        { name: 'Dev',    color: '#0079bf' },
        { name: 'Urgent', color: '#eb5a46' },
      ],
      columns: [
        { title: 'To Do',       color: '#0079bf', order: 0 },
        { title: 'In Progress', color: '#e6a817', order: 1 },
        { title: 'Done',        color: '#70b500', order: 2 },
      ],
    });
    res.status(201).json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/boards/:boardId', async (req, res) => {
  try {
    await Board.deleteOne({ _id: req.params.boardId });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Single Board ───────────────────────────────────────
router.get('/boards/:boardId', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/title', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    board.title = req.body.title || board.title;
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/background', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    board.background = req.body.background || board.background;
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/starred', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    board.starred = req.body.starred;
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Labels ─────────────────────────────────────────────
router.post('/boards/:boardId/labels', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    board.labels.push({ name: req.body.name, color: req.body.color });
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/labels/:labelId', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const label = board.labels.id(req.params.labelId);
    if (!label) return res.status(404).json({ error: 'Label not found' });
    if (req.body.name  !== undefined) label.name  = req.body.name;
    if (req.body.color !== undefined) label.color = req.body.color;
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/boards/:boardId/labels/:labelId', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    board.labels = board.labels.filter(l => l._id.toString() !== req.params.labelId);
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Columns ────────────────────────────────────────────
router.post('/boards/:boardId/columns', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    board.columns.push({ title: req.body.title, color: req.body.color, order: board.columns.length });
    await board.save(); res.status(201).json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/columns/:colId', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const col   = findCol(board, req.params.colId);
    if (!col) return res.status(404).json({ error: 'Column not found' });
    ['title','color','wipLimit'].forEach(f => { if (req.body[f] !== undefined) col[f] = req.body[f]; });
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/boards/:boardId/columns/:colId', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    board.columns = board.columns.filter(c => c._id.toString() !== req.params.colId);
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Cards ──────────────────────────────────────────────
router.post('/boards/:boardId/columns/:colId/cards', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const col   = findCol(board, req.params.colId);
    if (!col) return res.status(404).json({ error: 'Column not found' });
    col.cards.push({ ...req.body, order: col.cards.length, activity: [{ text: 'Card created' }] });
    await board.save(); res.status(201).json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/columns/:colId/cards/:cardId', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const col   = findCol(board, req.params.colId);
    const card  = findCard(col, req.params.cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const allowed = ['title','description','tags','priority','due','assignees','checklist','cover','points','completed','cardType','collapsed'];
    allowed.forEach(f => { if (req.body[f] !== undefined) card[f] = req.body[f]; });
    if (req.body.activityNote) logActivity(card, req.body.activityNote);
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/boards/:boardId/columns/:colId/cards/:cardId/duplicate', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const col   = findCol(board, req.params.colId);
    const card  = findCard(col, req.params.cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    col.cards.push({
      title: `${card.title} (copy)`, description: card.description, cover: card.cover,
      tags: [...card.tags], priority: card.priority, due: card.due,
      assignees: [...card.assignees], cardType: card.cardType,
      checklist: card.checklist.map(i => ({ text: i.text, done: false })),
      points: card.points, order: col.cards.length, activity: [{ text: 'Card duplicated' }],
    });
    await board.save(); res.status(201).json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/boards/:boardId/columns/:colId/cards/:cardId', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const col   = findCol(board, req.params.colId);
    if (!col) return res.status(404).json({ error: 'Column not found' });
    col.cards = col.cards.filter(c => c._id.toString() !== req.params.cardId);
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/columns/:colId/cards/:cardId/move', async (req, res) => {
  try {
    const board  = await Board.findById(req.params.boardId);
    const srcCol = findCol(board, req.params.colId);
    const dstCol = findCol(board, req.body.toColId);
    if (!srcCol || !dstCol) return res.status(404).json({ error: 'Column not found' });
    const cardIdx = srcCol.cards.findIndex(c => c._id.toString() === req.params.cardId);
    if (cardIdx === -1) return res.status(404).json({ error: 'Card not found' });
    const [card] = srcCol.cards.splice(cardIdx, 1);
    logActivity(card, `Moved to "${dstCol.title}"`);
    dstCol.cards.splice(req.body.toIndex ?? dstCol.cards.length, 0, card);
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/columns/:colId/cards/:cardId/timer', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const col   = findCol(board, req.params.colId);
    const card  = findCard(col, req.params.cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (req.body.action === 'start') {
      card.timerStart = new Date();
      logActivity(card, 'Timer started');
    } else if (req.body.action === 'stop' && card.timerStart) {
      const elapsed = Math.floor((Date.now() - new Date(card.timerStart).getTime()) / 1000);
      card.timerTotal = (card.timerTotal || 0) + elapsed;
      card.timerStart = null;
      logActivity(card, `Logged ${Math.round(elapsed/60)}m`);
    }
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/boards/:boardId/columns/:colId/cards/:cardId/comments', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const col   = findCol(board, req.params.colId);
    const card  = findCard(col, req.params.cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    card.comments.push({ text: req.body.text, author: req.body.author || 'Anonymous' });
    logActivity(card, `${req.body.author || 'Someone'} commented`);
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/boards/:boardId/columns/:colId/cards/:cardId/comments/:commentId', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    const col   = findCol(board, req.params.colId);
    const card  = findCard(col, req.params.cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    card.comments = card.comments.filter(c => c._id.toString() !== req.params.commentId);
    await board.save(); res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Whiteboard ─────────────────────────────────────────
router.get('/boards/:boardId/whiteboard', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    if (!board.whiteboard) {
      board.whiteboard = { title: `${board.title} — Whiteboard`, nodes: [] };
      await board.save();
    }
    res.json(board.whiteboard);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/boards/:boardId/whiteboard', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board.whiteboard) board.whiteboard = {};
    ['title','nodes','viewX','viewY','zoom'].forEach(f => {
      if (req.body[f] !== undefined) board.whiteboard[f] = req.body[f];
    });
    board.markModified('whiteboard');
    await board.save(); res.json(board.whiteboard);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Users & Plans ──────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort('name');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    ['name','email','plan','role','avatar'].forEach(f => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });
    await user.save(); res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/plans', (req, res) => res.json(PLANS));

// ── Legacy compat: /board → redirect to first board ───
router.get('/board', async (req, res) => {
  try {
    const board = await Board.findOne();
    if (!board) return res.status(404).json({ error: 'No board' });
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

// ── Auth (simple, no JWT — demo-grade) ────────────────
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, password: password || '', role: 'user' });
    const { password: _, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.password && user.password !== password) return res.status(401).json({ error: 'Wrong password' });
    const { password: _, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/auth/me/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/auth/me/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    ['name','nickname','avatar','bio','theme','language','emailNotify'].forEach(f => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });
    if (req.body.password && req.body.password.length >= 6) user.password = req.body.password;
    await user.save();
    const { password: _, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
