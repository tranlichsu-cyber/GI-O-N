import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.resolve();
const db = new Database('classroom.db');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'teacher'
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER,
    name TEXT,
    description TEXT,
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    name TEXT,
    student_code TEXT UNIQUE,
    password TEXT,
    FOREIGN KEY(class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    title TEXT,
    content TEXT,
    questions TEXT, -- JSON string
    due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER,
    student_id INTEGER,
    answers TEXT, -- JSON string
    score INTEGER,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assignment_id) REFERENCES assignments(id),
    FOREIGN KEY(student_id) REFERENCES students(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
      const result = stmt.run(email, hashedPassword, name, 'teacher');
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'teacher' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: 'teacher' } });
  });

  // Student Login
  app.post('/api/auth/student-login', async (req, res) => {
    const { student_code, password } = req.body;
    const student: any = db.prepare('SELECT * FROM students WHERE student_code = ?').get(student_code);
    if (!student || !(await bcrypt.compare(password, student.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: student.id, student_code: student.student_code, name: student.name, role: 'student', class_id: student.class_id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ user: { id: student.id, name: student.name, role: 'student' } });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ user: null });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ user: decoded });
    } catch (err) {
      res.json({ user: null });
    }
  });

  // --- CLASSROOM ROUTES ---
  app.get('/api/classes', authenticate, (req: any, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const classes = db.prepare('SELECT * FROM classes WHERE teacher_id = ?').all(req.user.id);
    res.json(classes);
  });

  app.post('/api/classes', authenticate, (req: any, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const { name, description } = req.body;
    const stmt = db.prepare('INSERT INTO classes (teacher_id, name, description) VALUES (?, ?, ?)');
    const result = stmt.run(req.user.id, name, description);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/classes/:id/students', authenticate, (req, res) => {
    const students = db.prepare('SELECT id, class_id, name, student_code FROM students WHERE class_id = ?').all(req.params.id);
    res.json(students);
  });

  app.post('/api/classes/:id/students', authenticate, async (req, res) => {
    const { name, student_code, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO students (class_id, name, student_code, password) VALUES (?, ?, ?, ?)');
    const result = stmt.run(req.params.id, name, student_code, hashedPassword);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/classes/:id/assignments', authenticate, (req, res) => {
    const assignments = db.prepare('SELECT * FROM assignments WHERE class_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(assignments.map((a: any) => ({ ...a, questions: JSON.parse(a.questions || '[]') })));
  });

  app.post('/api/classes/:id/assignments', authenticate, (req, res) => {
    const { title, content, questions, due_date } = req.body;
    const stmt = db.prepare('INSERT INTO assignments (class_id, title, content, questions, due_date) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(req.params.id, title, content, JSON.stringify(questions || []), due_date);
    res.json({ id: result.lastInsertRowid });
  });

  // --- STUDENT ROUTES ---
  app.get('/api/student/assignments', authenticate, (req: any, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
    const assignments = db.prepare('SELECT * FROM assignments WHERE class_id = ? ORDER BY created_at DESC').all(req.user.class_id);
    res.json(assignments.map((a: any) => ({ ...a, questions: JSON.parse(a.questions || '[]') })));
  });

  app.post('/api/student/submit', authenticate, (req: any, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
    const { assignment_id, answers, score } = req.body;
    const stmt = db.prepare('INSERT INTO submissions (assignment_id, student_id, answers, score) VALUES (?, ?, ?, ?)');
    const result = stmt.run(assignment_id, req.user.id, JSON.stringify(answers), score);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/student/submissions', authenticate, (req: any, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Forbidden' });
    const submissions = db.prepare('SELECT * FROM submissions WHERE student_id = ?').all(req.user.id);
    res.json(submissions.map((s: any) => ({ ...s, answers: JSON.parse(s.answers || '[]') })));
  });

  app.get('/api/assignments/:id/submissions', authenticate, (req: any, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
    const submissions = db.prepare(`
      SELECT s.*, st.name as student_name 
      FROM submissions s 
      JOIN students st ON s.student_id = st.id 
      WHERE s.assignment_id = ?
    `).all(req.params.id);
    res.json(submissions.map((s: any) => ({ ...s, answers: JSON.parse(s.answers || '[]') })));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
