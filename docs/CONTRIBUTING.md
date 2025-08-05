# Contributing to Flash Sales Dashboard

Thank you for your interest in contributing to Flash Sales Dashboard! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## 🤝 Code of Conduct

### Our Standards

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- **Be respectful** and inclusive in language and actions
- **Be collaborative** and constructive in discussions
- **Be patient** with newcomers and different skill levels  
- **Focus on what's best** for the community and project
- **Show empathy** towards other community members

### Unacceptable Behavior

The following behaviors are not tolerated:

- Harassment, discrimination, or hostile behavior
- Personal attacks or inflammatory language
- Publishing private information without permission
- Spam or off-topic contributions
- Any conduct that could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18.x+** and **npm 9.x+** installed
- **Git** configured with your name and email
- **Supabase** account for database access (if working on backend features)
- **Code editor** with TypeScript support (VS Code recommended)

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/flash-sales-dashboard.git
   cd flash-sales-dashboard
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/flash-sales-dashboard.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

6. **Verify setup**:
   ```bash
   npm run dev
   npm test
   ```

## 🔄 Development Workflow

### Branch Strategy

We use a **feature branch workflow**:

```
main (production-ready)
├── develop (integration branch)
├── feature/new-feature
├── bugfix/fix-description  
├── hotfix/critical-fix
└── docs/documentation-update
```

### Branch Naming Convention

- **Features**: `feature/description-of-feature`
- **Bug fixes**: `bugfix/short-description`
- **Hotfixes**: `hotfix/critical-issue`
- **Documentation**: `docs/what-you-are-documenting`
- **Refactor**: `refactor/component-or-area`

### Development Process

1. **Create a branch** from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new dashboard widget"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### Keeping Your Fork Updated

```bash
git checkout develop
git pull upstream develop
git push origin develop
```

## 📝 Coding Standards

### TypeScript Guidelines

- **Use strict TypeScript** - enable strict mode in `tsconfig.json`
- **Prefer interfaces** over types for object shapes
- **Use proper typing** - avoid `any`, prefer specific types
- **Document complex types** with JSDoc comments

```typescript
// ✅ Good
interface LeadData {
  id: string;
  email: string;
  territory: Territory;
  score?: number;
}

// ❌ Avoid
const processLead = (data: any) => {
  // ...
}
```

### React Component Guidelines

- **Use functional components** with hooks
- **Follow naming conventions**: PascalCase for components
- **Keep components small** and focused on a single responsibility
- **Use proper prop typing** with interfaces

```typescript
// ✅ Good
interface LeadCardProps {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
  className?: string;
}

export const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  onUpdate, 
  className 
}) => {
  // Component implementation
};
```

### File Organization

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (buttons, inputs)
│   ├── forms/           # Form components
│   └── [feature]/       # Feature-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and external integrations
├── pages/               # Next.js pages
├── services/            # Business logic and API calls
├── stores/              # State management (Zustand stores)
├── types/               # TypeScript type definitions
└── utils/               # Pure utility functions
```

### CSS/Styling Guidelines

- **Use Tailwind CSS** for styling
- **Prefer utility classes** over custom CSS
- **Use semantic color names** from our design system
- **Follow responsive design** principles

```tsx
// ✅ Good
<div className="bg-gray-900 text-green-400 rounded-lg p-4 hover:bg-gray-800 transition-colors">

// ❌ Avoid inline styles
<div style={{ backgroundColor: '#1a1a1a', color: '#4ade80' }}>
```

### Import Organization

```typescript
// 1. React and Next.js imports
import React from 'react';
import { NextPage } from 'next';

// 2. Third-party library imports
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';

// 3. Internal imports (absolute paths)
import { Lead } from '@/types/lead';
import { useLeads } from '@/hooks/useLeads';
import { LeadCard } from '@/components/leads/LeadCard';

// 4. Relative imports
import './component.css';
```

## 🧪 Testing Requirements

### Test Coverage Requirements

- **New features**: Must include unit tests with >80% coverage
- **Bug fixes**: Must include regression tests
- **Components**: Should include both unit and integration tests
- **Utilities**: Must have comprehensive unit tests

### Testing Guidelines

```typescript
// Component testing example
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadCard } from '../LeadCard';

describe('LeadCard', () => {
  const mockLead = {
    id: '1',
    email: 'test@example.com',
    territory: 'jamaica',
    score: 85
  };

  it('should display lead information correctly', () => {
    render(<LeadCard lead={mockLead} onUpdate={jest.fn()} />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should call onUpdate when edit button is clicked', async () => {
    const mockOnUpdate = jest.fn();
    render(<LeadCard lead={mockLead} onUpdate={mockOnUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(mockLead);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- LeadCard.test.tsx
```

## 🔍 Pull Request Process

### Before Submitting

- [ ] **Code follows** style guidelines and conventions
- [ ] **All tests pass** locally
- [ ] **No linting errors** or warnings
- [ ] **Build succeeds** without errors
- [ ] **Self-review** completed - check your own code
- [ ] **Documentation updated** if needed

### PR Title and Description

Use **conventional commit format** for PR titles:

```
feat: add AI-powered lead scoring dashboard
fix: resolve territory assignment bug
docs: update API documentation
refactor: simplify lead routing logic
test: add integration tests for submissions
```

**PR Description Template:**

```markdown
## 📝 Description
Brief description of changes and why they were made.

## 🎯 Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## 📷 Screenshots (if applicable)
Include screenshots for UI changes.

## 🔗 Related Issues
Closes #123
Related to #456

## 📋 Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer required
3. **Address feedback** promptly and professionally  
4. **Final approval** from project maintainer
5. **Merge** will be performed by maintainers

### Review Criteria

Reviewers will check for:

- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code clean, readable, and well-structured?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Testing**: Are there adequate tests?
- **Documentation**: Is documentation updated if needed?

## 🐛 Issue Guidelines

### Bug Reports

When reporting bugs, please include:

```markdown
## 🐛 Bug Description
A clear and concise description of the bug.

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## 🎯 Expected Behavior
What you expected to happen.

## 🖼️ Screenshots
If applicable, add screenshots to help explain the problem.

## 🌐 Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]
- Node.js version: [e.g. 18.0.0]
```

### Feature Requests

For feature requests, please include:

```markdown
## 🚀 Feature Description
A clear and concise description of the feature.

## 🎯 Problem Statement
What problem does this feature solve?

## 💡 Proposed Solution
Describe your proposed solution.

## 🔄 Alternatives Considered
Alternative solutions you've considered.

## 📊 Impact Assessment
- User experience impact
- Performance implications
- Maintenance overhead
```

### Issue Labels

We use the following labels to categorize issues:

- **`bug`**: Something isn't working
- **`enhancement`**: New feature or improvement
- **`documentation`**: Improvements to documentation
- **`good first issue`**: Good for newcomers
- **`help wanted`**: Extra attention is needed
- **`priority: high`**: High priority issues
- **`territory: jamaica`**: Jamaica-specific issues
- **`component: dashboard`**: Dashboard-related issues

## 🏆 Recognition

We appreciate all contributions! Contributors will be:

- **Listed** in our contributors section
- **Mentioned** in release notes for significant contributions
- **Invited** to join our community discussions
- **Considered** for maintainer status based on consistent contributions

## 📞 Getting Help

If you need help contributing:

- **📖 Documentation**: Check our [docs](.) folder
- **💬 Discussions**: Join GitHub Discussions for questions
- **🐛 Issues**: Create an issue for bugs or feature requests
- **📧 Contact**: Reach out to maintainers directly

## 📜 Commit Message Guidelines

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: New feature
- **fix**: Bug fix  
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```
feat(dashboard): add AI lead scoring widget
fix(auth): resolve login redirect issue
docs(api): update GraphQL schema documentation
test(components): add tests for LeadCard component
```

---

Thank you for contributing to Flash Sales Dashboard! Your efforts help make Bitcoin adoption across the Caribbean more accessible and efficient. 🚀