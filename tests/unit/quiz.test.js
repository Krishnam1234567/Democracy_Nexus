jest.mock('../../src/data/election-data.json', () => ({
  quiz: {
    questions: [
      {
        id: 'q1',
        category: 'voting',
        difficulty: 'beginner',
        question: 'What does EVM stand for?',
        options: ['Electronic Voting Machine', 'Extra Voter Movement', 'Election Verification Method', 'Electronic Voter Module'],
        correct: 0,
        explanation: 'EVM stands for Electronic Voting Machine.'
      },
      {
        id: 'q2',
        category: 'voting',
        difficulty: 'beginner',
        question: 'Test question 2?',
        options: ['A', 'B', 'C', 'D'],
        correct: 1,
        explanation: 'Test explanation.'
      },
      {
        id: 'q3',
        category: 'registration',
        difficulty: 'intermediate',
        question: 'Test question 3?',
        options: ['A', 'B', 'C', 'D'],
        correct: 2,
        explanation: 'Test explanation.'
      }
    ]
  },
  glossary: [],
  checklist: [],
  timeline: {}
}));

jest.mock('../../src/js/analytics', () => ({
  trackQuizComplete: jest.fn()
}));

jest.mock('../../src/js/firestore', () => ({
  saveQuizScore: jest.fn().mockResolvedValue(null),
  getLeaderboard: jest.fn().mockResolvedValue([])
}));

import { 
  selectQuestions, 
  handleAnswer, 
  getGrade,
  getQuizState 
} from '../../src/js/quiz';

describe('Quiz Module', () => {
  describe('selectQuestions', () => {
    it('returns all questions when category is "all"', () => {
      const questions = selectQuestions('all', 'all');
      expect(questions.length).toBeGreaterThan(0);
      expect(Array.isArray(questions)).toBe(true);
    });

    it('filters by category', () => {
      const filtered = selectQuestions('voting', 'all');
      expect(filtered.every(q => q.category === 'voting')).toBe(true);
    });

    it('filters by difficulty', () => {
      const filtered = selectQuestions('all', 'beginner');
      expect(filtered.every(q => q.difficulty === 'beginner')).toBe(true);
    });

    it('limits to 10 questions', () => {
      const questions = selectQuestions('all', 'all');
      expect(questions.length).toBeLessThanOrEqual(10);
    });

    it('returns empty array when no questions match', () => {
      const questions = selectQuestions('nonexistent_category', 'all');
      expect(questions.length).toBe(0);
    });
  });

  describe('getGrade', () => {
    it('returns Outstanding for 90%+', () => {
      expect(getGrade(90)).toContain('Outstanding');
      expect(getGrade(100)).toContain('Outstanding');
    });

    it('returns Excellent for 80-89%', () => {
      expect(getGrade(80)).toContain('Excellent');
      expect(getGrade(89)).toContain('Excellent');
    });

    it('returns Great job for 70-79%', () => {
      expect(getGrade(70)).toContain('Great job');
      expect(getGrade(79)).toContain('Great job');
    });

    it('returns Good effort for 50-69%', () => {
      expect(getGrade(50)).toContain('Good effort');
      expect(getGrade(69)).toContain('Good effort');
    });

    it('returns Keep trying for 30-49%', () => {
      expect(getGrade(30)).toContain('Keep trying');
      expect(getGrade(49)).toContain('Keep trying');
    });

    it('returns Study up for below 30%', () => {
      expect(getGrade(0)).toContain('Study up');
      expect(getGrade(29)).toContain('Study up');
    });
  });

  describe('getQuizState', () => {
    it('returns an object with quiz state properties', () => {
      const state = getQuizState();
      expect(state).toHaveProperty('currentQuestion');
      expect(state).toHaveProperty('score');
      expect(state).toHaveProperty('totalQuestions');
      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('selectedDifficulty');
      expect(state).toHaveProperty('selectedCategory');
      expect(state).toHaveProperty('timeRemaining');
    });

    it('returns correct types', () => {
      const state = getQuizState();
      expect(typeof state.currentQuestion).toBe('number');
      expect(typeof state.score).toBe('number');
      expect(typeof state.isActive).toBe('boolean');
    });
  });
});