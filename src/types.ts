export type AppTab = 'home' | 'planner' | 'worksheet' | 'game' | 'aitools' | 'classroom' | 'student_dashboard';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'teacher' | 'student';
}

export interface Class {
  id: number;
  name: string;
  description: string;
}

export interface Student {
  id: number;
  class_id: number;
  name: string;
  student_code: string;
  password?: string; // Only for creation/server
}

export interface Assignment {
  id: number;
  class_id: number;
  title: string;
  content: string;
  due_date: string;
  created_at: string;
  questions?: Question[]; // JSON in DB
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  answers: any[]; // JSON
  score: number;
  submitted_at: string;
}

export interface Question {
  qType: 'mcq' | 'text';
  q: string;
  opts?: string[];
  ans?: number; // index for MCQ
  correctText?: string; // for essay/text
}

export interface Game {
  id: string;
  icon: string;
  name: string;
  type: string;
  questions: Question[];
}

export interface Player {
  name: string;
  avatar: string;
  score: number;
}

export interface Room {
  status: 'waiting' | 'playing' | 'ended';
  ts: number;
  players?: Record<string, Player>;
  msg?: {
    type: 'question' | 'reveal' | 'end';
    q?: string;
    opts?: string[];
    qType?: 'mcq' | 'text';
    qIdx?: number;
    ansIdx?: string | number;
    _ts: number;
  };
  answers?: Record<string, Record<string, { ans: string | number }>>;
}
