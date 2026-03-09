# AGENTS.md - Wrong Question App Development Guide

## Project Overview

A React + Express + MongoDB application for managing student incorrect questions (错题本). Uses AI for OCR recognition and similar question generation.

## Project Structure

```
wrong-question-app/
├── src/                      # React frontend (root level)
│   ├── components/           # React components (.jsx files)
│   ├── contexts/             # React Context (AuthContext.js, UploadContext.js)
│   ├── utils/                # Utility functions (formatters.js, constants.js)
│   ├── types/                # Type definitions (user.js, question.js, api.js)
│   ├── __tests__/            # Frontend Jest tests
│   ├── App.js                # Main app component
│   └── index.js              # Entry point
├── server/                   # Express backend
│   ├── routes/               # API routes
│   ├── controllers/          # Route controllers
│   ├── tests/                # Backend Jest tests
│   └── server.js             # Express server entry
└── package.json              # Root package.json (frontend)
```

---

## Build, Lint, and Test Commands

### Frontend (React)

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on port 3000 |
| `npm run build` | Production build to `./build` folder |
| `npm test` | Run tests in watch mode |
| `npm test -- --watchAll=false` | Run all tests once (CI mode) |
| `npm test -- src/__tests__/Home.test.js` | Run single test file |
| `npm test -- --testPathPattern=Home` | Run tests matching pattern |
| `npm test -- -t "renders question"` | Run tests with specific name |
| `npm run eject` | Eject from react-scripts |

### Backend (Express/Node.js)

| Command | Description |
|---------|-------------|
| `cd server && npm start` | Start server on port 5001 |
| `cd server && npm run dev` | Start with nodemon (auto-reload) |
| `cd server && npm test` | Run backend Jest tests |
| `cd server && npm test -- --testNamePattern="should create"` | Run single test |

### Running Both Services

```bash
# Terminal 1: Frontend
npm start

# Terminal 2: Backend
cd server && npm run dev
```

---

## Code Style Guidelines

### General Principles

- **Language**: JavaScript (no TypeScript)
- **Framework**: React 19, Express, Material-UI 7
- **Testing**: Jest with @testing-library/react
- **No custom ESLint/Prettier config** - uses react-scripts defaults

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Home.jsx`, `QuestionCard.jsx` |
| Hooks | camelCase starting with `use` | `useAuth`, `useEffect` |
| Variables | camelCase | `userData`, `questionList` |
| Functions | camelCase | `handleSubmit`, `fetchQuestions` |
| Constants | camelCase or UPPER_SNAKE | `API_BASE_URL`, `MAX_FILE_SIZE` |
| Files (utils/contexts) | camelCase | `formatters.js`, `AuthContext.js` |
| CSS classes | kebab-case | `question-card`, `subject-chip` |

### Import Order

```javascript
// 1. React imports
import React, { useState, useEffect, useCallback } from 'react';

// 2. External libraries (Material-UI, react-router, etc.)
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Button, Card } from '@mui/material';
import { SomeIcon } from 'lucide-react';

// 3. Internal components
import Home from './components/Home';
import Upload from './components/Upload';

// 4. Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// 5. Utils
import { formatDate, getGradeLabel } from './utils/formatters';

// 6. Styles
import './App.css';
```

### Component Structure

```jsx
// Functional component with hooks
function ComponentName({ prop1, prop2 }) {
  // 1. State
  const [state, setState] = useState(initialValue);

  // 2. Hooks (useEffect, useCallback, etc.)
  useEffect(() => {
    // effect logic
  }, [dependency]);

  // 3. Event handlers
  const handleClick = () => { ... };

  // 4. Render
  return (
    <Container>
      <Component>...</Component>
    </Container>
  );
}

export default ComponentName;
```

### MUI Component Usage

- Use MUI components for all UI elements
- Access theme via `useTheme()` hook or `sx` prop
- Use responsive breakpoints: `xs`, `sm`, `md`, `lg`, `xl`
- Example: `sx={{ display: { xs: 'none', sm: 'block' } }}`

### Error Handling

**Frontend:**
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error('请先登录');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  setData(data);
} catch (err) {
  console.error('操作失败:', err);
  setError('操作失败，请重试');
}
```

**Backend:**
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
```

### Async/Await

- Always wrap in try/catch for error handling
- Use async/await over .then() chains for readability

### CSS/Styling

- Use MUI's `sx` prop for inline styles
- Use CSS classes in `.css` files for complex styles
- Follow existing patterns in `App.css`

---

## Test Guidelines

### Frontend Tests

Location: `src/__tests__/`

```javascript
import { render, screen } from '@testing-library/react';
import ComponentName from '../components/ComponentName';

describe('ComponentName Tests', () => {
  beforeEach(() => {
    // setup
  });

  test('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText(/expected/i)).toBeInTheDocument();
  });
});
```

### Backend Tests

Location: `server/tests/`

```javascript
const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  test('endpoint description', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ field: 'value' })
      .expect(200);
    
    expect(response.body.field).toBe('value');
  });
});
```

### Running Specific Tests

```bash
# Frontend: single file
npm test -- src/__tests__/Home.test.js

# Frontend: by test name
npm test -- -t "renders question"

# Backend: by test name
cd server && npm test -- --testNamePattern="should create"
```

---

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_BASE_URL=http://localhost:5001/api
```

### Backend (server/.env)
```
MONGODB_URI=mongodb://localhost:27017/wrong-question-db
PORT=5001
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### Questions
- `POST /api/questions` - Create question
- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get single question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### AI Features
- `POST /api/ai/analyze` - AI analyze question
- `POST /api/ai/generate-similar` - Generate similar questions

---

## Common Development Tasks

### Adding a New Component
1. Create `src/components/ComponentName.jsx`
2. Use functional component with hooks
3. Export as default
4. Import in `App.js` and add route

### Adding a New API Endpoint
1. Create route in `server/routes/newRoute.js`
2. Import in `server/server.js`
3. Add middleware: `app.use('/api/newRoute', newRoute);`

### Adding a New Test
1. Create test file in `src/__tests__/` or `server/tests/`
2. Follow existing test patterns
3. Run with `npm test`

---

## Notes

- This is a Chinese-language application - UI text is in Chinese
- Code comments are mixed (Chinese and English)
- Uses MongoDB with Mongoose ODM
- JWT authentication with token in `x-auth-token` header
- OCR/AI services require external API keys (智谱AI, DeepSeek)
