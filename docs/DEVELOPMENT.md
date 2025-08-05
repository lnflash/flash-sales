# Development Guide

A comprehensive guide for setting up and developing the Flash Sales Dashboard locally, including best practices, tooling, and development workflows.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Database Development](#database-development)
- [Performance](#performance)
- [Debugging](#debugging)

## 🔧 Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18.x+ | Runtime environment |
| **npm** | 9.x+ | Package manager |
| **Git** | 2.x+ | Version control |
| **VS Code** | Latest | Recommended editor |

### Recommended Extensions (VS Code)

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-jest",
    "ms-vscode.vscode-json",
    "graphql.vscode-graphql",
    "supabase.supabase-vscode"
  ]
}
```

### Browser Development Tools

- **React Developer Tools** - Component inspection
- **Apollo Client Developer Tools** - GraphQL debugging
- **Redux DevTools** - State management debugging

## 🚀 Local Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-org/flash-sales-dashboard.git
cd flash-sales-dashboard

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Environment Configuration

Create `.env.local` with your development credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
DATABASE_URL=postgresql://username:password@host:port/database

# Application Configuration
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true

# External Services (Optional)
OPENAI_API_KEY=your-openai-key-for-ai-features
NEXT_PUBLIC_GRAPHQL_URI=https://api.flashapp.me/graphql
```

### 3. Database Setup

```bash
# Initialize Supabase project
npm run supabase:setup

# Generate TypeScript types
npm run supabase:types

# Test database connection
npm run supabase:test
```

### 4. Verify Installation

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check linting
npm run lint

# Build for production (test)
npm run build
```

## 🌐 Development Environment

### Development Server

```bash
# Start development server
npm run dev

# Development server with turbo mode
npm run dev -- --turbo

# Start on different port
npm run dev -- --port 3001
```

### Hot Reloading Features

The development server includes:
- **Fast Refresh** - Instant component updates
- **CSS Hot Reloading** - Style changes without refresh
- **API Route Updates** - Server-side changes reload automatically
- **Error Overlay** - Detailed error information in browser

### Environment-Specific Features

```typescript
// Development-only features
if (process.env.NODE_ENV === 'development') {
  // Enable debug logging
  console.log('Debug info:', data);
  
  // Development-only components
  return <DebugPanel />;
}
```

## 📁 Project Structure

```
flash-sales-dashboard/
├── 📁 public/                    # Static assets
│   ├── icons/                   # App icons and favicons
│   ├── images/                  # Static images
│   └── manifest.json            # PWA manifest
├── 📁 src/
│   ├── 📁 components/           # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── forms/              # Form components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── layout/             # Layout components
│   │   └── [feature]/          # Feature-specific components
│   ├── 📁 hooks/               # Custom React hooks
│   │   ├── supabase/          # Supabase-specific hooks
│   │   └── [feature]/         # Feature-specific hooks
│   ├── 📁 lib/                 # Utilities and integrations
│   │   ├── supabase/          # Supabase client setup
│   │   └── utils.ts           # General utilities
│   ├── 📁 pages/               # Next.js pages and API routes
│   │   ├── api/               # API endpoints
│   │   └── dashboard/         # Dashboard pages
│   ├── 📁 services/            # Business logic services
│   ├── 📁 stores/              # State management (Zustand)
│   ├── 📁 styles/              # Global styles and CSS modules
│   ├── 📁 types/               # TypeScript type definitions
│   └── 📁 utils/               # Helper functions and utilities
├── 📁 docs/                     # Documentation
├── 📁 tests/                    # Test configuration and utilities
├── 📄 .env.example             # Environment template
├── 📄 .env.local               # Local environment (gitignored)
├── 📄 next.config.js           # Next.js configuration
├── 📄 tailwind.config.js       # Tailwind CSS configuration
├── 📄 tsconfig.json            # TypeScript configuration
└── 📄 jest.config.js           # Jest testing configuration
```

### Component Organization

```typescript
// Feature-based component structure
src/components/dashboard/
├── widgets/                    # Dashboard widgets
│   ├── StatsOverviewWidget.tsx
│   ├── PerformanceChartWidget.tsx
│   └── index.tsx              # Export all widgets
├── DashboardGrid.tsx          # Main dashboard layout
├── DashboardHeader.tsx        # Dashboard header
└── index.tsx                  # Export all dashboard components
```

### Naming Conventions

- **Components**: PascalCase (`LeadCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useLeads.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`Lead.ts`, `DatabaseTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

## 🔄 Development Workflow

### Daily Development

1. **Start Development Session**
   ```bash
   # Pull latest changes
   git pull origin develop
   
   # Start development server
   npm run dev
   
   # In another terminal, run tests in watch mode
   npm run test:watch
   ```

2. **Feature Development Process**
   ```bash
   # Create feature branch
   git checkout -b feature/new-dashboard-widget
   
   # Make changes and test
   # ... development work ...
   
   # Run quality checks
   npm run lint
   npm test
   npm run build
   
   # Commit changes
   git add .
   git commit -m "feat: add performance metrics widget"
   
   # Push and create PR
   git push origin feature/new-dashboard-widget
   ```

### Code Quality Workflow

```bash
# Before committing, run full quality check
npm run quality-check

# This runs:
# - TypeScript compilation
# - ESLint checks
# - Prettier formatting
# - Jest tests
# - Build verification
```

### Branch Strategy

```
main (production)
├── develop (integration)
├── feature/ai-lead-scoring
├── feature/territory-dashboard
├── bugfix/authentication-fix
└── hotfix/critical-security-patch
```

## 🧪 Testing

### Test Structure

```
src/
├── __tests__/                  # Global tests
├── components/
│   └── __tests__/             # Component tests
├── hooks/
│   └── __tests__/             # Hook tests
├── utils/
│   └── __tests__/             # Utility tests
└── pages/
    └── __tests__/             # Page tests
```

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- LeadCard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

### Writing Tests

#### Component Testing

```typescript
// components/__tests__/LeadCard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadCard } from '../LeadCard';

// Mock dependencies
jest.mock('@/hooks/useLeads');

describe('LeadCard', () => {
  const mockLead = {
    id: '1',
    email: 'test@example.com',
    territory: 'jamaica',
    score: 85,
    status: 'new'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render lead information correctly', () => {
    render(<LeadCard lead={mockLead} />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Jamaica')).toBeInTheDocument();
  });

  it('should handle status updates', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = jest.fn();
    
    render(<LeadCard lead={mockLead} onUpdate={mockOnUpdate} />);
    
    const statusButton = screen.getByRole('button', { name: /update status/i });
    await user.click(statusButton);
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockLead,
      status: 'contacted'
    });
  });
});
```

#### Hook Testing

```typescript
// hooks/__tests__/useLeads.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeads } from '../useLeads';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useLeads', () => {
  it('should fetch leads successfully', async () => {
    const { result } = renderHook(() => useLeads(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(10);
  });
});
```

### Test Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 📏 Code Quality

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'error',
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
    }],
  },
};
```

### Prettier Configuration

```javascript
// prettier.config.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
};
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

## 💾 Database Development

### Supabase Development

1. **Local Supabase Instance**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Start local instance
   supabase start
   
   # Apply migrations
   supabase db push
   
   # Reset database
   supabase db reset
   ```

2. **Working with Migrations**
   ```bash
   # Create new migration
   supabase migration new add_lead_scoring_table
   
   # Apply specific migration
   supabase db push --include-seed
   
   # Generate types after schema changes
   npm run supabase:types
   ```

3. **Database Schema Development**
   ```sql
   -- migrations/add_lead_scoring_table.sql
   CREATE TABLE lead_scores (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
     score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
     factors JSONB NOT NULL DEFAULT '{}',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can view scores for their territory leads" 
   ON lead_scores FOR SELECT 
   USING (
     lead_id IN (
       SELECT id FROM leads 
       WHERE territory = ANY(
         SELECT unnest(territories) 
         FROM profiles 
         WHERE id = auth.uid()
       )
     )
   );
   ```

### GraphQL Development

```typescript
// lib/graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_LEADS = gql`
  query GetLeads($territory: String!, $limit: Int = 10) {
    leads(
      where: { territory: { _eq: $territory } }
      limit: $limit
      order_by: { created_at: desc }
    ) {
      id
      email
      territory
      status
      score
      created_at
    }
  }
`;

export const UPDATE_LEAD_STATUS = gql`
  mutation UpdateLeadStatus($id: uuid!, $status: String!) {
    update_leads_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, updated_at: "now()" }
    ) {
      id
      status
      updated_at
    }
  }
`;
```

## ⚡ Performance

### Performance Monitoring

```typescript
// lib/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start} milliseconds`);
  }
};

// Usage in components
const MyComponent = () => {
  useEffect(() => {
    measurePerformance('Data processing', () => {
      processLargeDataSet();
    });
  }, []);
};
```

### Bundle Analysis

```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build

# Check for unused dependencies
npm install -g depcheck
depcheck

# Lighthouse audit
npm install -g lighthouse
lighthouse http://localhost:3000 --output=html
```

### Optimization Techniques

1. **Code Splitting**
   ```typescript
   // Dynamic imports for large components
   const DashboardChart = dynamic(
     () => import('@/components/dashboard/DashboardChart'),
     { loading: () => <ChartSkeleton /> }
   );
   ```

2. **Image Optimization**
   ```typescript
   import Image from 'next/image';
   
   <Image
     src="/dashboard-hero.jpg"
     alt="Dashboard"
     width={800}
     height={400}
     priority // For above-the-fold images
     placeholder="blur" // For better UX
   />
   ```

3. **API Optimization**
   ```typescript
   // Use React Query for caching
   const { data: leads } = useQuery({
     queryKey: ['leads', territory],
     queryFn: () => fetchLeads(territory),
     staleTime: 5 * 60 * 1000, // 5 minutes
     gcTime: 10 * 60 * 1000, // 10 minutes
   });
   ```

## 🐛 Debugging

### Development Tools

1. **React Developer Tools**
   - Component tree inspection
   - Props and state debugging
   - Performance profiling

2. **Network Debugging**
   ```typescript
   // Log all API requests in development
   if (process.env.NODE_ENV === 'development') {
     const originalFetch = window.fetch;
     window.fetch = (...args) => {
       console.log('Fetch:', args[0]);
       return originalFetch(...args);
     };
   }
   ```

3. **State Debugging**
   ```typescript
   // Zustand store debugging
   import { subscribeWithSelector } from 'zustand/middleware';
   import { devtools } from 'zustand/middleware';
   
   const useStore = create(
     devtools(
       subscribeWithSelector((set, get) => ({
         // store implementation
       }))
     )
   );
   ```

### Common Issues and Solutions

#### 1. Hydration Mismatches

```typescript
// Solution: Use useEffect for client-only code
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;

return <ClientOnlyComponent />;
```

#### 2. Supabase Connection Issues

```typescript
// Debug Supabase connection
const debugSupabase = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    console.log('Supabase connection:', { data, error });
  } catch (err) {
    console.error('Supabase error:', err);
  }
};
```

#### 3. TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Logging and Monitoring

```typescript
// lib/logger.ts
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = process.env.NODE_ENV === 'development' 
      ? LogLevel.DEBUG 
      : LogLevel.WARN;
  }

  error(message: string, ...args: any[]) {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
```

## 🔧 Development Scripts

### Custom NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:turbo": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "quality-check": "npm run type-check && npm run lint && npm test && npm run build",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:types": "tsx src/scripts/generate-types.ts",
    "supabase:reset": "supabase db reset",
    "analyze": "ANALYZE=true npm run build",
    "clean": "rm -rf .next node_modules/.cache"
  }
}
```

---

## 📞 Development Support

For development questions and issues:

- **📖 Documentation**: Check other docs in this folder
- **🐛 Issues**: Create GitHub issue with development details
- **💬 Discussions**: Join community discussions
- **🔍 Debugging**: Use the debugging techniques outlined above

Happy coding! 🚀