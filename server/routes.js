const express = require('express');
const router  = express.Router();
const Board   = require('./models');

// Helper: find column + card inside a board document
const findCol  = (board, colId)  => board.columns.id(colId);
const findCard = (col, cardId)   => col?.cards.id(cardId);

// ── Board ─────────────────────────────────────────────

// GET  /api/board          – get (or create) the single board
router.get('/board', async (req, res) => {
  try {
    let board = await Board.findOne();
    if (!board) {
      board = await Board.create({
        title: 'My Board',
        columns: [
          { title: 'To Do',       color: '#0079bf', order: 0, cards: [] },
          { title: 'In Progress', color: '#e6a817', order: 1, cards: [] },
          { title: 'Done',        color: '#70b500', order: 2, cards: [] },
        ],
      });
    }
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/board/title
router.patch('/board/title', async (req, res) => {
  try {
    const board = await Board.findOne();
    board.title = req.body.title || board.title;
    await board.save();
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Columns ───────────────────────────────────────────

// POST /api/board/columns
router.post('/board/columns', async (req, res) => {
  try {
    const board = await Board.findOne();
    board.columns.push({ title: req.body.title, color: req.body.color, order: board.columns.length });
    await board.save();
    res.status(201).json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/board/columns/:colId
router.patch('/board/columns/:colId', async (req, res) => {
  try {
    const board = await Board.findOne();
    const col   = findCol(board, req.params.colId);
    if (!col) return res.status(404).json({ error: 'Column not found' });
    if (req.body.title !== undefined) col.title = req.body.title;
    if (req.body.color !== undefined) col.color = req.body.color;
    await board.save();
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/board/columns/:colId
router.delete('/board/columns/:colId', async (req, res) => {
  try {
    const board = await Board.findOne();
    board.columns = board.columns.filter(c => c._id.toString() !== req.params.colId);
    await board.save();
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/board/columns/reorder  – body: { orderedIds: ['colId1','colId2',...] }
router.patch('/board/columns/reorder', async (req, res) => {
  try {
    const board = await Board.findOne();
    const { orderedIds } = req.body;
    board.columns = orderedIds.map((id, i) => {
      const col = findCol(board, id);
      col.order = i;
      return col;
    });
    await board.save();
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Cards ─────────────────────────────────────────────

// POST /api/board/columns/:colId/cards
router.post('/board/columns/:colId/cards', async (req, res) => {
  try {
    const board = await Board.findOne();
    const col   = findCol(board, req.params.colId);
    if (!col) return res.status(404).json({ error: 'Column not found' });
    col.cards.push({ ...req.body, order: col.cards.length });
    await board.save();
    res.status(201).json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/board/columns/:colId/cards/:cardId
router.patch('/board/columns/:colId/cards/:cardId', async (req, res) => {
  try {
    const board = await Board.findOne();
    const col   = findCol(board, req.params.colId);
    const card  = findCard(col, req.params.cardId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const allowed = ['title','description','tags','priority','due','assignees','checklist'];
    allowed.forEach(f => { if (req.body[f] !== undefined) card[f] = req.body[f]; });
    await board.save();
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/board/columns/:colId/cards/:cardId
router.delete('/board/columns/:colId/cards/:cardId', async (req, res) => {
  try {
    const board = await Board.findOne();
    const col   = findCol(board, req.params.colId);
    if (!col) return res.status(404).json({ error: 'Column not found' });
    col.cards = col.cards.filter(c => c._id.toString() !== req.params.cardId);
    await board.save();
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/board/columns/:colId/cards/:cardId/move
// body: { toColId, toIndex }
router.patch('/board/columns/:colId/cards/:cardId/move', async (req, res) => {
  try {
    const board  = await Board.findOne();
    const srcCol = findCol(board, req.params.colId);
    const dstCol = findCol(board, req.body.toColId);
    if (!srcCol || !dstCol) return res.status(404).json({ error: 'Column not found' });
    const cardIdx = srcCol.cards.findIndex(c => c._id.toString() === req.params.cardId);
    if (cardIdx === -1) return res.status(404).json({ error: 'Card not found' });
    const [card] = srcCol.cards.splice(cardIdx, 1);
    const toIdx  = req.body.toIndex ?? dstCol.cards.length;
    dstCol.cards.splice(toIdx, 0, card);
    await board.save();
    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
