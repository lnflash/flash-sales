import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useApolloClient } from '@apollo/client';
import LoginForm from './LoginForm';
import { saveUserToStorage } from '@/lib/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: jest.fn(),
  gql: jest.fn((query) => query),
}));

jest.mock('@/lib/auth', () => ({
  saveUserToStorage: jest.fn(),
}));


describe('LoginForm', () => {
  const mockPush = jest.fn();
  const mockQuery = jest.fn();
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log in tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useApolloClient as jest.Mock).mockReturnValue({
      query: mockQuery,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('renders login form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Enter your username to access the Flash Sales Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it.skip('shows error when username is empty', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Continue' });
    const usernameInput = screen.getByLabelText('Username');
    
    // Clear the input to ensure it's empty
    fireEvent.change(usernameInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your username')).toBeInTheDocument();
    });
  });


  it('handles successful login with GraphQL', async () => {
    
    mockQuery.mockResolvedValue({
      data: {
        accountDefaultWallet: {
          id: 'real_user_123',
          __typename: 'ConsumerAccount',
          walletCurrency: 'USD',
        },
      },
    });

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('Username');
    const submitButton = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(usernameInput, { target: { value: 'realuser' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith({
        query: expect.any(Array),
        variables: { username: 'realuser' },
        fetchPolicy: 'network-only',
      });
      expect(saveUserToStorage).toHaveBeenCalledWith({
        username: 'realuser',
        userId: 'real_user_123',
        loggedInAt: expect.any(Number),
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles GraphQL errors gracefully', async () => {
    process.env.NODE_ENV = 'production';
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockQuery.mockRejectedValue({
      graphQLErrors: [{ message: 'User not found' }],
    });

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('Username');
    const submitButton = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(usernameInput, { target: { value: 'erroruser' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('The API could not verify this username. Please try again.')).toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('handles network errors gracefully', async () => {
    process.env.NODE_ENV = 'production';
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockQuery.mockRejectedValue({
      networkError: new Error('Network error'),
    });

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('Username');
    const submitButton = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(usernameInput, { target: { value: 'networkuser' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Could not connect to the authentication service. Please check your connection.')).toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('shows loading state during authentication', async () => {
    mockQuery.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: {
          accountDefaultWallet: {
            id: 'test_user_123',
          },
        },
      }), 100))
    );

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('Username');
    const submitButton = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(usernameInput, { target: { value: 'flash' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Checking...')).toBeInTheDocument();
    expect(usernameInput).toBeDisabled();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Checking...')).not.toBeInTheDocument();
    });
  });

  it('trims whitespace from username', async () => {
    mockQuery.mockResolvedValue({
      data: {
        accountDefaultWallet: {
          id: 'test_user_123',
        },
      },
    });

    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('Username');
    const submitButton = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(usernameInput, { target: { value: '  flash  ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith({
        query: expect.anything(),
        variables: { username: 'flash' },
        fetchPolicy: 'network-only',
      });
      expect(saveUserToStorage).toHaveBeenCalledWith({
        username: 'flash',
        userId: 'test_user_123',
        loggedInAt: expect.any(Number),
      });
    });
  });
});