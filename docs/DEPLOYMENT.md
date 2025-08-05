# Deployment Guide

This guide covers deploying Flash Sales Dashboard to various production environments, including DigitalOcean App Platform, Vercel, AWS, and Docker-based deployments.

## 📋 Table of Contents

- [Pre-deployment Checklist](#pre-deployment-checklist)
- [Environment Variables](#environment-variables)
- [DigitalOcean App Platform](#digitalocean-app-platform)
- [Vercel Deployment](#vercel-deployment)
- [AWS Deployment](#aws-deployment)
- [Docker Deployment](#docker-deployment)
- [Database Setup](#database-setup)
- [Post-deployment Tasks](#post-deployment-tasks)
- [Troubleshooting](#troubleshooting)

## ✅ Pre-deployment Checklist

Before deploying to production, ensure you have:

- [ ] **Supabase project** configured and running
- [ ] **Environment variables** properly configured
- [ ] **Database migrations** applied
- [ ] **Row Level Security (RLS)** policies enabled
- [ ] **Domain name** configured (if using custom domain)
- [ ] **SSL certificates** configured
- [ ] **Monitoring** and logging set up
- [ ] **Backup strategy** implemented

## 🔐 Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
DATABASE_URL=postgresql://username:password@host:port/database

# Application Configuration
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Optional Variables

```bash
# GraphQL Configuration
NEXT_PUBLIC_GRAPHQL_URI=https://api.flashapp.me/graphql
NEXT_PUBLIC_API_BASE_URL=/api

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true

# External Services
OPENAI_API_KEY=your-openai-key
WEBHOOK_SECRET=your-webhook-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

### Environment Variable Security

- **Never commit** `.env` files to version control
- **Use platform-specific** secret management
- **Rotate keys** regularly
- **Limit scope** of API keys to minimum required permissions

## 🌊 DigitalOcean App Platform

DigitalOcean App Platform is our recommended deployment platform for its simplicity and Caribbean region availability.

### Deployment Steps

1. **Connect Repository**
   ```bash
   # Fork the repository to your GitHub account
   # Or use the DigitalOcean CLI
   doctl apps create --spec .do/app.yaml
   ```

2. **Configure App Spec**
   
   Create `.do/app.yaml`:
   ```yaml
   name: flash-sales-dashboard
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/flash-sales-dashboard
       branch: main
       deploy_on_push: true
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     routes:
     - path: /
     health_check:
       http_path: /api/health
     envs:
     - key: NEXT_PUBLIC_SUPABASE_URL
       value: ${SUPABASE_URL}
       type: SECRET
     - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
       value: ${SUPABASE_ANON_KEY}
       type: SECRET
     - key: SUPABASE_SERVICE_ROLE_KEY
       value: ${SUPABASE_SERVICE_ROLE_KEY}
       type: SECRET
     - key: NEXT_PUBLIC_APP_ENV
       value: production
     - key: NEXT_PUBLIC_USE_SUPABASE
       value: "true"
   ```

3. **Set Environment Variables**
   ```bash
   # Using DigitalOcean CLI
   doctl apps update $APP_ID --spec .do/app.yaml
   
   # Or via the control panel
   # Go to your app → Settings → Environment Variables
   ```

4. **Custom Domain (Optional)**
   ```bash
   # Add custom domain via CLI
   doctl apps update-domain $APP_ID --domain your-domain.com
   
   # Configure DNS records:
   # CNAME: your-domain.com → your-app.ondigitalocean.app
   ```

### DigitalOcean-Specific Features

- **Automatic HTTPS** with Let's Encrypt certificates
- **Global CDN** for static assets
- **Auto-scaling** based on traffic
- **Built-in monitoring** and logging
- **Zero-downtime deployments**

## ▲ Vercel Deployment

Vercel provides excellent Next.js integration and global edge network.

### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Or use the deploy button
# https://vercel.com/new/clone?repository-url=https://github.com/your-username/flash-sales-dashboard
```

### Vercel Configuration

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### Environment Variables in Vercel

```bash
# Set via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Or via dashboard:
# Go to Project Settings → Environment Variables
```

## ☁️ AWS Deployment

Deploy using AWS Amplify or EC2 with proper load balancing.

### AWS Amplify

1. **Connect Repository**
   ```bash
   # Install Amplify CLI
   npm install -g @aws-amplify/cli
   
   # Initialize Amplify
   amplify init
   
   # Add hosting
   amplify add hosting
   amplify publish
   ```

2. **Build Settings**
   
   Create `amplify.yml`:
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: .next
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
   ```

### AWS EC2 with Docker

```bash
# Launch EC2 instance with Docker
# Security groups: HTTP (80), HTTPS (443), SSH (22)

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Deploy application
docker run -d \
  --name flash-dashboard \
  -p 80:3000 \
  --env-file .env.production \
  your-registry/flash-sales-dashboard:latest

# Set up reverse proxy with nginx
sudo yum install -y nginx
# Configure nginx.conf for SSL termination
```

## 🐳 Docker Deployment

### Production Docker Setup

1. **Multi-stage Dockerfile**
   ```dockerfile
   # Build stage
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production && npm cache clean --force
   COPY . .
   RUN npm run build
   
   # Production stage
   FROM node:18-alpine AS runner
   WORKDIR /app
   
   ENV NODE_ENV=production
   ENV NEXT_TELEMETRY_DISABLED=1
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT=3000
   
   CMD ["node", "server.js"]
   ```

2. **Docker Compose for Production**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production
       restart: unless-stopped
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - app
       restart: unless-stopped
   ```

3. **Deploy with Docker Compose**
   ```bash
   # Production deployment
   docker-compose -f docker-compose.prod.yml up -d
   
   # View logs
   docker-compose logs -f
   
   # Update deployment
   docker-compose pull
   docker-compose up -d
   ```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flash-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flash-dashboard
  template:
    metadata:
      labels:
        app: flash-dashboard
    spec:
      containers:
      - name: app
        image: your-registry/flash-sales-dashboard:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: flash-dashboard-service
spec:
  selector:
    app: flash-dashboard
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

## 💾 Database Setup

### Supabase Production Configuration

1. **Enable Row Level Security**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
   ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
   ```

2. **Apply Security Policies**
   ```sql
   -- User can only see their own profile
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);
   
   -- Territory-based access for submissions
   CREATE POLICY "Territory access for submissions" ON submissions
     FOR SELECT USING (
       territory = ANY(
         SELECT unnest(territories) 
         FROM profiles 
         WHERE id = auth.uid()
       )
     );
   ```

3. **Performance Optimization**
   ```sql
   -- Create indexes for better performance
   CREATE INDEX idx_submissions_territory ON submissions(territory);
   CREATE INDEX idx_submissions_created_at ON submissions(created_at);
   CREATE INDEX idx_deals_status ON deals(status);
   CREATE INDEX idx_activities_owner_id ON activities(owner_id);
   ```

### Database Migrations

```bash
# Run migrations
npm run supabase:migration:up

# Generate types after migration
npm run supabase:types

# Verify migration status
supabase migration list
```

## 🚀 Post-deployment Tasks

### Health Checks

1. **Application Health**
   ```bash
   # Check application status
   curl https://your-domain.com/api/health
   
   # Expected response:
   # {"status": "ok", "timestamp": "2024-01-01T00:00:00.000Z"}
   ```

2. **Database Connectivity**
   ```bash
   # Test database connection
   curl https://your-domain.com/api/debug-env
   
   # Check for Supabase connection errors in logs
   ```

3. **Feature Verification**
   - [ ] User authentication works
   - [ ] Dashboard loads with data
   - [ ] Real-time features function
   - [ ] Territory switching works
   - [ ] AI features are operational

### Performance Optimization

1. **CDN Configuration**
   - Enable CDN for static assets
   - Configure cache headers
   - Optimize image delivery

2. **Database Performance**
   - Monitor query performance
   - Add indexes for slow queries
   - Enable connection pooling

3. **Application Monitoring**
   ```bash
   # Set up monitoring with Sentry
   npm install @sentry/nextjs
   
   # Configure in next.config.js
   const { withSentry } = require('@sentry/nextjs');
   module.exports = withSentry(nextConfig);
   ```

### Security Hardening

1. **HTTPS Configuration**
   - Force HTTPS redirects
   - Enable HSTS headers
   - Configure CSP headers

2. **API Security**
   - Rate limiting on API endpoints
   - CORS configuration
   - Input validation

3. **Supabase Security**
   - Review RLS policies
   - Audit user permissions
   - Enable audit logging

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: Cross-origin requests failing
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};
```

#### 2. Environment Variable Issues

**Problem**: Environment variables not loading
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Solution**:
- Verify variables are set in deployment platform
- Check variable names match exactly (case-sensitive)
- Ensure `NEXT_PUBLIC_` prefix for client-side variables
- Redeploy after adding variables

#### 3. Database Connection Issues

**Problem**: Cannot connect to Supabase
```
Error: connect ECONNREFUSED
```

**Solution**:
- Verify Supabase URL and keys
- Check database is running
- Confirm network connectivity
- Review RLS policies

#### 4. Build Failures

**Problem**: Next.js build fails
```
Error: Build failed with 1 error
```

**Solution**:
- Check TypeScript errors: `npm run lint`
- Verify all imports are correct
- Ensure environment variables are available during build
- Review build logs for specific errors

### Monitoring and Logging

1. **Application Logs**
   ```bash
   # DigitalOcean
   doctl apps logs $APP_ID --follow
   
   # Vercel
   vercel logs --follow
   
   # Docker
   docker-compose logs -f
   ```

2. **Performance Monitoring**
   - Set up Sentry for error tracking
   - Configure Vercel Analytics
   - Use browser dev tools for performance profiling

3. **Database Monitoring**
   - Monitor Supabase dashboard
   - Set up alerts for high resource usage
   - Review slow query logs

### Rollback Procedures

1. **Application Rollback**
   ```bash
   # DigitalOcean - rollback to previous deployment
   doctl apps create-deployment $APP_ID --spec previous-app.yaml
   
   # Vercel - promote previous deployment
   vercel promote $DEPLOYMENT_URL --scope=team
   
   # Docker - rollback to previous image
   docker-compose pull image:previous-tag
   docker-compose up -d
   ```

2. **Database Rollback**
   ```bash
   # Rollback Supabase migration
   supabase migration repair --status reverted $MIGRATION_ID
   
   # Or restore from backup
   supabase db restore backup-file.sql
   ```

## 📊 Performance Benchmarks

### Target Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **API Response Time**: < 500ms

### Optimization Strategies

1. **Code Splitting**: Implement route-based code splitting
2. **Image Optimization**: Use Next.js Image component
3. **Caching**: Configure proper cache headers
4. **Database**: Optimize queries and add indexes
5. **CDN**: Use global CDN for static assets

---

## 📞 Support

For deployment issues:

- **📖 Documentation**: Review this guide and related docs
- **🐛 Issues**: Create GitHub issue with deployment details
- **💬 Community**: Join discussions for deployment help
- **📧 Contact**: Reach out to maintainers for critical issues

Remember to follow security best practices and monitor your deployment regularly for optimal performance and security.