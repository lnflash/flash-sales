# Flash Sales Dashboard

An administrative dashboard for Flash sales management, designed to work with data collected from the Flash Intake Form application.

## Overview

The Flash Sales Dashboard provides a comprehensive view of merchant data captured by the intake form app, allowing administrators to monitor sales performance, analyze trends, and manage merchant relationships. It features a modern, dark-themed UI with intuitive navigation and interactive visualizations.

## Features

- **Real-Time Dashboard**: Overview of key metrics including total submissions, signups, and interest levels
- **Interactive Data Visualization**: Charts and graphs showing trends and distributions
- **Submission Management**: View, filter, and search through all merchant submissions
- **Detailed Analytics**: In-depth analysis of sales performance and merchant engagement
- **Responsive Design**: Fully mobile-friendly interface that works well on all devices
- **Dark Theme**: Modern dark UI with green and yellow accents matching Flash branding

## Technology Stack

- **Frontend**: React, Next.js, TypeScript
- **State Management**: React Query for server state, React Hooks for local state
- **Styling**: Tailwind CSS for utility-first styling
- **Data Visualization**: Chart.js with React Chart.js 2
- **Data Fetching**: React Query
- **Tables**: TanStack Table (React Table)
- **Forms**: React Hook Form with Zod validation
- **Testing**: Jest and React Testing Library
- **Containerization**: Docker for deployment

## Prerequisites

- Node.js v18.x or higher
- npm v9.x or higher

## Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd flash-sales-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   INTAKE_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_API_BASE_URL=/api
   NEXT_PUBLIC_APP_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:3000`

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

### Building the Docker Image

```bash
npm run docker:build
```

Or manually:

```bash
docker build -t flash-sales-dashboard .
```

### Running the Docker Container

```bash
npm run docker:run
```

Or manually:

```bash
docker run -p 3000:3000 flash-sales-dashboard
```

## Deployment on DigitalOcean

This application is designed to be deployed on the DigitalOcean App Platform. Follow these steps:

1. Create a new app on DigitalOcean App Platform
2. Connect your GitHub repository
3. Configure the app settings:
   - Choose the Docker build type
   - Set the environment variables:
     - `INTAKE_API_URL`: URL of the Flash Intake Form API
     - `NEXT_PUBLIC_APP_ENV`: Set to `production`
4. Deploy the app

For detailed deployment instructions, please refer to the [DigitalOcean App Platform documentation](https://docs.digitalocean.com/products/app-platform/).

## Project Structure

```
flash-sales-dashboard/
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   │   ├── dashboard/ # Dashboard specific components
│   │   ├── layout/    # Layout components
│   │   └── submissions/ # Submission management components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and API client
│   ├── pages/         # Next.js pages
│   ├── styles/        # Global styles
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Helper functions
├── Dockerfile         # Docker configuration
├── jest.config.js     # Jest configuration
├── next.config.js     # Next.js configuration
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## License

This project is proprietary and confidential. Unauthorized copying, transferring, or reproduction of the contents of this project, via any medium is strictly prohibited.

## Contact

For questions or support, please contact the Flash development team.