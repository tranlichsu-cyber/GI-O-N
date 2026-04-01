export type AppTab = 'planner' | 'worksheet' | 'game' | 'aitools';

export interface Question {
  qType: 'mcq' | 'text';
  q: string;
  opts?: string[];
  ans?: number;
  correctText?: string;
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
