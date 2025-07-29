"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql, useApolloClient } from '@apollo/client';
import { saveUserToStorage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

// Define the GraphQL query
const CHECK_USERNAME_QUERY = gql`
  query accountDefaultWallet($username: Username!) {
    accountDefaultWallet(username: $username, walletCurrency: USD) {
      __typename
      id
      walletCurrency
    }
  }
`;

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const client = useApolloClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log("Checking username:", username.trim());
      
      const { data } = await client.query({
        query: CHECK_USERNAME_QUERY,
        variables: { username: username.trim() },
        fetchPolicy: 'network-only',
      });
      
      console.log("GraphQL result:", data);
      
      if (data?.accountDefaultWallet?.id) {
        saveUserToStorage({
          username: username.trim(),
          userId: data.accountDefaultWallet.id,
          loggedInAt: Date.now(),
        });
        router.push('/dashboard');
      } else {
        setError('Username not found. Please try again.');
      }
    } catch (err: any) {
      // Provide more specific error message
      let errorMessage = 'An error occurred. Please try again.';
      
      // Check for specific error types and provide better messages
      if (err && typeof err === 'object') {
        if (err.graphQLErrors && Array.isArray(err.graphQLErrors) && err.graphQLErrors.length > 0) {
          // Handle GraphQL validation errors
          errorMessage = 'The API could not verify this username. Please try again.';
          console.error('GraphQL errors:', err.graphQLErrors);
        } else if (err.networkError) {
          // Handle network connectivity errors
          errorMessage = 'Could not connect to the authentication service. Please check your connection.';
          console.error('Network error:', err.networkError);
        }
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-flash-green to-flash-green-light flex items-center justify-center text-white font-bold text-xl">
            F
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Enter your username to access the Flash Sales Dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-light-text-primary">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-flash-green hover:bg-flash-green-light"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Continue'
            )}
          </Button>
          
          <div className="text-center text-sm text-light-text-secondary">
            <p>Enter your Flash account username</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}