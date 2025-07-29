"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveUserToStorage } from '@/lib/auth';
import { checkUsernameSimulated } from '@/lib/graphql';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      
      // Use simulated auth for now
      const result = await checkUsernameSimulated(username.trim());
      console.log("Auth result:", result);
      
      if (result.exists && result.userId) {
        saveUserToStorage({
          username: username.trim(),
          userId: result.userId,
          loggedInAt: Date.now(),
        });
        router.push('/dashboard');
      } else {
        setError('Username not found. Please try again.');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
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
            <p className="mb-1">Test usernames for development:</p>
            <p className="font-mono text-xs">flash, sales, admin, demo, test</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}