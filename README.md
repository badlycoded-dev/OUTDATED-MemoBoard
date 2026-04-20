# MemoBoard 🧠

A full-stack Trello-style kanban board — Express + MongoDB backend, React + Bootstrap frontend.

## Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Backend  | Node.js, Express 4, Mongoose 8, MongoDB   |
| Frontend | React 18, Bootstrap 5, Bootstrap Icons    |
| DnD      | @hello-pangea/dnd (React 18 compatible)   |
| Dev      | concurrently, nodemon, CRA                |

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
# Edit MONGO_URI if needed
```

### 3. Run (both server + client)
```bash
npm run dev
```

- **Client** → http://localhost:3000
- **Server** → http://localhost:5000
- **Health** → http://localhost:5000/health

## API Reference

### Board
| Method | Endpoint          | Body              | Description        |
|--------|-------------------|-------------------|--------------------|
| GET    | `/api/board`      | —                 | Get/create board   |
| PATCH  | `/api/board/title`| `{ title }`       | Rename board       |

### Columns
| Method | Endpoint                      | Body              | Description        |
|--------|-------------------------------|-------------------|--------------------|
| POST   | `/api/board/columns`          | `{ title, color }`| Add column         |
| PATCH  | `/api/board/columns/:id`      | `{ title, color }`| Update column      |
| DELETE | `/api/board/columns/:id`      | —                 | Delete column      |

### Cards
| Method | Endpoint                                    | Body                      | Description  |
|--------|---------------------------------------------|---------------------------|--------------|
| POST   | `/api/board/columns/:colId/cards`           | card fields               | Add card     |
| PATCH  | `/api/board/columns/:colId/cards/:cardId`   | card fields               | Update card  |
| DELETE | `/api/board/columns/:colId/cards/:cardId`   | —                         | Delete card  |
| PATCH  | `/api/board/columns/:colId/cards/:cardId/move` | `{ toColId, toIndex }` | Move card    |

## Card schema
```js
{
  title:       String,          // required
  description: String,
  tags:        ['design','dev','research','urgent'],
  priority:    'low' | 'med' | 'high',
  due:         Date,
  assignees:   [String],        // comma-separated names in UI
  checklist:   [{ text, done }],
}
```

## Project Structure
```
memoboard/
├── package.json          # root – concurrently scripts
├── server/
│   ├── index.js          # Express entry + MongoDB connect
│   ├── models.js         # Mongoose Board/Column/Card schemas
│   ├── routes.js         # All REST routes
│   └── .env.example
└── client/
    ├── public/index.html
    └── src/
        ├── App.jsx             # Board root + DnD context
        ├── index.js            # React entry
        ├── index.css           # Trello-inspired styles
        ├── api/board.js        # Axios API helpers
        ├── hooks/useBoard.js   # Board state hook
        └── components/
            ├── TrelloColumn.jsx
            ├── TrelloCard.jsx
            └── CardModal.jsx
```
