const mongoose = require('mongoose');

// ── Card ──────────────────────────────────────────────
const checklistItemSchema = new mongoose.Schema({
  text:  { type: String, required: true },
  done:  { type: Boolean, default: false },
});

const cardSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  description:{ type: String, default: '' },
  tags:       [{ type: String, enum: ['design','dev','research','urgent'] }],
  priority:   { type: String, enum: ['low','med','high'], default: 'med' },
  due:        { type: Date },
  assignees:  [{ type: String }],
  checklist:  [checklistItemSchema],
  order:      { type: Number, default: 0 },
}, { timestamps: true });

// ── Column ────────────────────────────────────────────
const columnSchema = new mongoose.Schema({
  title:  { type: String, required: true, trim: true },
  color:  { type: String, default: '#0079bf' },
  order:  { type: Number, default: 0 },
  cards:  [cardSchema],
}, { timestamps: true });

// ── Board ─────────────────────────────────────────────
const boardSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true, default: 'My Board' },
  columns: [columnSchema],
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);
