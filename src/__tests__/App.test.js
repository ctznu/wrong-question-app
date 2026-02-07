// src/__tests__/App.test.js
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the child components since we're testing App integration
jest.mock('../components/Home', () => () => <div data-testid="home-component">Home Component</div>);
jest.mock('../components/Upload/index', () => () => <div data-testid="upload-component">Upload Component</div>);
jest.mock('../components/QuestionDetail', () => () => <div data-testid="question-detail-component">Question Detail Component</div>);
jest.mock('../components/Generator', () => () => <div data-testid="generator-component">Generator Component</div>);
jest.mock('../components/Printer', () => () => <div data-testid="printer-component">Printer Component</div>);
jest.mock('../components/Statistics', () => () => <div data-testid="statistics-component">Statistics Component</div>);
jest.mock('../components/Auth/Login', () => () => <div data-testid="login-component">Login Component</div>);
jest.mock('../components/Auth/Register', () => () => <div data-testid="register-component">Register Component</div>);

describe('App Component Integration Tests', () => {
  test('renders main application title', () => {
    render(<App />);
    const titleElement = screen.getByText(/易错题管理系统/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders navigation buttons', () => {
    render(<App />);
    const homeButton = screen.getByText(/首页/i);
    const uploadButton = screen.getByText(/上传/i);
    const generatorButton = screen.getByText(/生成题目/i);
    const printerButton = screen.getByText(/打印/i);
    const statisticsButton = screen.getByText(/统计分析/i);
    
    expect(homeButton).toBeInTheDocument();
    expect(uploadButton).toBeInTheDocument();
    expect(generatorButton).toBeInTheDocument();
    expect(printerButton).toBeInTheDocument();
    expect(statisticsButton).toBeInTheDocument();
  });
});