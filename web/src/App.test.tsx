import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('should render Fill Randomly button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/randomly/i);
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toBeInstanceOf(HTMLButtonElement);
});
