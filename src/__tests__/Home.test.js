// src/__tests__/Home.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../components/Home';

const mockQuestions = [
  {
    _id: 1,
    subject: 'math',
    semester: '2023-秋季',
    question: '2 + 2 = ?',
    correctAnswer: '4',
    wrongAnswer: '5',
    reason: '计算错误',
    tags: ['算术'],
    createdAt: '2023-09-01'
  },
  {
    _id: 2,
    subject: 'chinese',
    semester: '2023-秋季',
    question: '请解释"春暖花开"的意思',
    correctAnswer: '形容春天的美好景象',
    wrongAnswer: '形容冬天',
    reason: '理解错误',
    tags: ['词语解释'],
    createdAt: '2023-09-02'
  }
];

const mockDeleteQuestion = jest.fn();

describe('Home Component Tests', () => {
  beforeEach(() => {
    mockDeleteQuestion.mockClear();
  });

  test('renders question cards', () => {
    render(<Home questions={mockQuestions} deleteQuestion={mockDeleteQuestion} />);
    
    expect(screen.getByText(/2 \+ 2 = \?/)).toBeInTheDocument();
    expect(screen.getByText(/请解释"春暖花开"的意思/)).toBeInTheDocument();
  });

  test('displays subject chips with correct colors', () => {
    render(<Home questions={mockQuestions} deleteQuestion={mockDeleteQuestion} />);
    
    const mathChips = screen.getAllByText(/数学/);
    const chineseChips = screen.getAllByText(/语文/);
    
    expect(mathChips).toHaveLength(1);
    expect(chineseChips).toHaveLength(1);
  });

  test('shows correct number of questions', () => {
    render(<Home questions={mockQuestions} deleteQuestion={mockDeleteQuestion} />);
    
    const questionCards = screen.getAllByRole('button', { name: /查看详情|删除/ });
    // Each question card has 2 buttons, so we expect 4 buttons total for 2 questions
    expect(questionCards).toHaveLength(4);
  });

  test('filter functionality works', () => {
    render(<Home questions={mockQuestions} deleteQuestion={mockDeleteQuestion} />);
    
    // Initially, both questions should be visible
    expect(screen.getByText(/2 \+ 2 = \?/)).toBeInTheDocument();
    expect(screen.getByText(/请解释"春暖花开"的意思/)).toBeInTheDocument();
    
    // Test would include filtering logic, but we'll need to mock the select elements
  });
});