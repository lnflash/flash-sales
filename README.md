# Flash Sales Dashboard 🚀

> A comprehensive CRM and sales intelligence platform designed for multi-territory Bitcoin adoption across the Caribbean region.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.0-blue.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-blue.svg)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Contributing](#contributing)
- [Support](#support)

## 🎯 Overview

Flash Sales Dashboard is a Next.js-powered CRM platform specifically designed for managing Bitcoin adoption initiatives across Caribbean territories (Jamaica, Cayman Islands, and Curaçao). It combines real-time collaboration, AI-powered lead scoring, and comprehensive sales intelligence to drive merchant onboarding and territory expansion.

### 🌍 Multi-Territory Support
- **Jamaica**: Primary market with full feature set
- **Cayman Islands**: Expanding market with specialized compliance features  
- **Curaçao**: Growing market with localized business requirements

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- **Smart Lead Scoring**: Machine learning algorithms evaluate lead quality and conversion probability
- **Predictive Analytics**: Forecast sales trends and territory performance
- **Automated Data Enrichment**: Enhance lead profiles with external data sources

### 🔄 Real-Time Collaboration  
- **Live User Presence**: See who's working on leads in real-time
- **Real-Time Updates**: Instant synchronization across all connected users
- **Activity Streams**: Track all interactions and changes as they happen

### 📊 Advanced Analytics
- **Territory Dashboards**: Region-specific performance metrics and insights
- **Sales Pipeline Visualization**: Interactive funnel analysis and conversion tracking
- **Performance Heatmaps**: Visual representation of rep and territory performance

### 🎯 Lead Management
- **Dynamic Intake Forms**: Territory-specific lead capture with smart validation
- **Intelligent Routing**: Automatic lead assignment based on territory and expertise
- **Workflow Automation**: Streamlined processes for lead qualification and follow-up

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **npm** 9.x or higher  
- **Supabase** project (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/flash-sales.git
   cd flash-sales
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

### Quick Commands
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm test                # Run test suite
npm run test:watch      # Run tests in watch mode

# Database
npm run supabase:setup  # Initialize Supabase project
npm run supabase:types  # Generate TypeScript types

# Docker
npm run docker:build    # Build Docker image
npm run docker:run      # Run containerized app
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[🔧 Development Guide](docs/DEVELOPMENT.md)** | Local setup, coding standards, and best practices |
| **[🏗️ Architecture Overview](docs/ARCHITECTURE.md)** | System design, data flow, and technical decisions |
| **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** | Production deployment across different platforms |
| **[🤝 Contributing Guidelines](docs/CONTRIBUTING.md)** | How to contribute, PR process, and code standards |
| **[📋 Features Documentation](docs/FEATURES.md)** | Detailed feature guides and user documentation |
| **[🔌 API Reference](docs/API.md)** | GraphQL schema, endpoints, and integration examples |

## 🛠️ Technology Stack

### Core Framework
- **[Next.js 14](https://nextjs.org/)** - React framework with SSR/SSG
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[React 18](https://reactjs.org/)** - UI component library

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service with PostgreSQL
- **[GraphQL](https://graphql.org/)** - API query language with Apollo Client
- **[Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)** - Fine-grained data access control

### UI & Styling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Chart.js](https://www.chartjs.org/)** - Interactive data visualization
- **[Lucide Icons](https://lucide.dev/)** - Beautiful & consistent icons

### State Management & Data
- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight client state
- **[React Hook Form](https://react-hook-form.com/)** - Performant form handling
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

### Development & Testing
- **[Jest](https://jestjs.io/)** - JavaScript testing framework
- **[React Testing Library](https://testing-library.com/)** - Component testing utilities
- **[ESLint](https://eslint.org/)** - Code linting and formatting
- **[Docker](https://www.docker.com/)** - Containerization platform

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) for details on:

- **Code of Conduct** - Community standards and expectations
- **Development Workflow** - Branch strategy and PR process  
- **Coding Standards** - Style guides and best practices
- **Testing Requirements** - Unit tests and integration testing

### Quick Contribution Steps
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📞 Support

### Getting Help
- **📖 Documentation**: Check our comprehensive [docs](docs/) folder
- **🐛 Bug Reports**: Open an issue with detailed reproduction steps
- **💡 Feature Requests**: Submit enhancement proposals via GitHub issues
- **💬 Discussions**: Join community conversations in GitHub Discussions

### Community Resources
- **Development Team**: Flash Bitcoin development team
- **Project Maintainers**: Core contributors and reviewers
- **Community Guidelines**: Please follow our code of conduct

---

## 📄 License

MIT License

**© 2021 Island Bitcoin LLC. All rights reserved.**
