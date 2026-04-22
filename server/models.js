const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text:   { type: String, required: true },
  author: { type: String, default: 'Anonymous' },
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  text: { type: String, required: true },
}, { timestamps: true });

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
});

const cardSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  cover:       { type: String, default: '' },
  cardType:    { type: String, enum: ['task','note','compact'], default: 'task' },
  tags:        [{ type: String }],
  priority:    { type: String, enum: ['low','med','high'], default: 'med' },
  due:         { type: Date },
  assignees:   [{ type: String }],
  checklist:   [checklistItemSchema],
  comments:    [commentSchema],
  activity:    [activitySchema],
  points:      { type: Number, default: 0 },
  timerTotal:  { type: Number, default: 0 },
  timerStart:  { type: Date, default: null },
  completed:   { type: Boolean, default: false },
  collapsed:   { type: Boolean, default: false },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

const columnSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  color:    { type: String, default: '#0079bf' },
  wipLimit: { type: Number, default: 0 },
  order:    { type: Number, default: 0 },
  cards:    [cardSchema],
}, { timestamps: true });

const labelSchema = new mongoose.Schema({
  name:  { type: String, default: '' },
  color: { type: String, required: true },
});

const whiteboardNodeSchema = new mongoose.Schema({
  type:    { type: String, enum: ['sticky','text','shape'], default: 'sticky' },
  x:       { type: Number, default: 0 },
  y:       { type: Number, default: 0 },
  w:       { type: Number, default: 200 },
  h:       { type: Number, default: 120 },
  content: { type: String, default: '' },
  color:   { type: String, default: '#fff9c4' },
});

const whiteboardSchema = new mongoose.Schema({
  title: { type: String, default: 'Whiteboard' },
  nodes: [whiteboardNodeSchema],
  viewX: { type: Number, default: 0 },
  viewY: { type: Number, default: 0 },
  zoom:  { type: Number, default: 1 },
}, { timestamps: true });

const boardSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, default: 'My Board' },
  background:  { type: String, default: '#0067a3' },
  columns:     [columnSchema],
  labels:      [labelSchema],
  whiteboard:  whiteboardSchema,
  memoStackId: { type: mongoose.Schema.Types.ObjectId },
  starred:     { type: Boolean, default: false },
  description: { type: String, default: '' },
}, { timestamps: true });

const memoStackSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  color:     { type: String, default: '#0079bf' },
  icon:      { type: String, default: '📋' },
  isPrivate: { type: Boolean, default: false },
  order:     { type: Number, default: 0 },
}, { timestamps: true });

const PLANS = ['Free', 'Pro', 'Team', 'Enterprise'];

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:    { type: String, default: '' },  // plain for demo; bcrypt in prod
  nickname:    { type: String, default: '' },
  avatar:      { type: String, default: '' },  // URL or initials fallback
  bio:         { type: String, default: '' },
  plan:        { type: String, enum: PLANS, default: 'Free' },
  role:        { type: String, enum: ['user', 'admin'], default: 'user' },
  theme:       { type: String, enum: ['light','dark','system'], default: 'system' },
  language:    { type: String, default: 'en' },
  emailNotify: { type: Boolean, default: true },
}, { timestamps: true });

const Board     = mongoose.model('Board', boardSchema);
const MemoStack = mongoose.model('MemoStack', memoStackSchema);
const User      = mongoose.model('User', userSchema);

module.exports = { Board, MemoStack, User, PLANS };
