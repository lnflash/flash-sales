// GraphQL client and utilities
import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache, gql } from '@apollo/client';

// Default GraphQL endpoint URI
const DEFAULT_GRAPHQL_URI = 'https://api.flashapp.me/graphql';

// GraphQL endpoint URI - priority order:
// 1. Environment variable (NEXT_PUBLIC_GRAPHQL_URI)
// 2. Default fallback for known hosting platforms
// 3. Dynamic determination from current host (only if safe)
// 4. Absolute default fallback
let GRAPHQL_URI = process.env.NEXT_PUBLIC_GRAPHQL_URI || DEFAULT_GRAPHQL_URI;

// Log the initial URI from environment if available
if (process.env.NEXT_PUBLIC_GRAPHQL_URI) {
  console.log('Using GraphQL URI from environment variable:', GRAPHQL_URI);
}

// For development or if we need to determine the host dynamically
if (!process.env.NEXT_PUBLIC_GRAPHQL_URI && typeof window !== 'undefined') {
  try {
    const host = window.location.host;
    const hostParts = host.split('.');
    
    // Blocklist of domains where dynamic determination should be avoided
    // These domains should use the default or environment variable instead
    const blockedDomains = [
      'ondigitalocean.app',
      'vercel.app',
      'netlify.app',
      'github.io',
      'flashapp.me',  // Custom domain should use default API
      'intake.flashapp.me'  // Specific subdomain
    ];
    
    // Check if we're on a blocked domain
    const isBlockedDomain = blockedDomains.some(domain => host.includes(domain));
    
    if (isBlockedDomain) {
      // Use the default GraphQL URI for hosting platforms
      console.log(`Detected hosting platform (${host}). Using default GraphQL URI: ${DEFAULT_GRAPHQL_URI}`);
      GRAPHQL_URI = DEFAULT_GRAPHQL_URI;
    } 
    // Only attempt dynamic determination if not on a blocked domain
    else if (hostParts[0] !== 'api') {
      hostParts[0] = 'api';
      const apiHost = hostParts.join('.');
      // Override the default URI if we can determine it from the host
      const dynamicURI = `https://${apiHost}/graphql`;
      console.log('Using dynamically determined GraphQL URI:', dynamicURI);
      GRAPHQL_URI = dynamicURI;
    }
  } catch (e) {
    console.warn('Failed to determine dynamic API endpoint, using default:', e);
    GRAPHQL_URI = DEFAULT_GRAPHQL_URI;
  }
}

// IP forwarding middleware to preserve client IP
const ipForwardingMiddleware = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      "x-real-ip": operation.getContext()["x-real-ip"],
      "x-forwarded-for": operation.getContext()["x-forwarded-for"],
    },
  }));

  return forward(operation);
});

// Determine if we should use the proxy
// Use proxy for all production deployments (not localhost) to avoid CORS issues
const shouldUseProxy = typeof window !== 'undefined' && 
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1');

// Use proxy endpoint for production deployments to avoid CORS issues
const graphqlEndpoint = shouldUseProxy ? '/api/graphql-proxy' : GRAPHQL_URI;

if (shouldUseProxy) {
  console.log('Using GraphQL proxy to avoid CORS issues on production domain:', window.location.hostname);
}

// Create a GraphQL client instance
export const graphQLClient = new ApolloClient({
  link: concat(
    ipForwardingMiddleware,
    new HttpLink({
      uri: graphqlEndpoint,
    }),
  ),
  cache: new InMemoryCache(),
});

// Query to check if username exists
export const CHECK_USERNAME_QUERY = gql`
  query accountDefaultWallet($username: Username!) {
    accountDefaultWallet(username: $username, walletCurrency: USD) {
      __typename
      id
      walletCurrency
    }
  }
`;

// Query to get current user profile
export const ME_QUERY = gql`
  query me {
    me {
      id
      phone
      username
      language
      email {
        address
        verified
      }
      quizQuestions {
        question {
          id
          earnAmount
        }
        completed
      }
      contacts {
        id
        username
        alias
        transactionsCount
      }
      createdAt
      defaultAccount {
        id
        defaultWalletId
        wallets {
          id
          walletCurrency
          balance
        }
      }
    }
  }
`;


// Function to check if username exists - this tries to use the real endpoint
// but falls back to simulation if there's an error
export async function checkUsername(username: string, req?: any): Promise<{ exists: boolean, userId?: string }> {
  try {
    
    console.log(`🔍 Checking username '${username}' against API at: ${GRAPHQL_URI}`);
    
    // Try to use the real GraphQL API
    // Define query options with proper typing for Apollo Client
    const queryOptions: {
      query: typeof CHECK_USERNAME_QUERY;
      variables: { username: string };
      context?: {
        "x-real-ip"?: string;
        "x-forwarded-for"?: string;
      };
    } = {
      query: CHECK_USERNAME_QUERY,
      variables: { username },
    };
    
    // Only add IP headers if we have a request object (server-side)
    if (req && req.headers) {
      queryOptions.context = {
        "x-real-ip": req.headers["x-real-ip"] as string,
        "x-forwarded-for": req.headers["x-forwarded-for"] as string,
      };
    }
    
    // Execute the query
    const { data } = await graphQLClient.query(queryOptions);
    
    // Log API response with clear indication of success or failure
    if (data?.accountDefaultWallet) {
      console.log(`✅ Authentication successful for user '${username}' with ID: ${data.accountDefaultWallet.id}`);
    } else {
      console.log(`❌ Authentication failed - user '${username}' not found in API response:`, data);
    }
    
    // If we get a valid response, the username exists
    return { 
      exists: !!data?.accountDefaultWallet,
      userId: data?.accountDefaultWallet?.id || `user_${Date.now()}`,
    };
  } catch (error: any) {
    // Log more detailed error information to help with debugging
    if (error && typeof error === 'object') {
      if (error.graphQLErrors && Array.isArray(error.graphQLErrors)) {
        error.graphQLErrors.forEach((err: any) => {
          console.error('GraphQL error:', err?.message, err?.path);
        });
      }
      if (error.networkError) {
        console.error('Network error:', error.networkError);
      }
    }
    console.error('Error checking username with API:', error);
    
    // Return error response
    return { 
      exists: false,
      userId: undefined
    };
  }
}

// Export for backward compatibility
export interface AuthResult {
  exists: boolean;
  userId?: string;
}