'use client';

import { ApolloProvider } from '@apollo/client';
import { graphQLClient } from './graphql';
import { ReactNode } from 'react';

interface ApolloProviderWrapperProps {
  children: ReactNode;
}

export function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  return (
    <ApolloProvider client={graphQLClient}>
      {children}
    </ApolloProvider>
  );
}