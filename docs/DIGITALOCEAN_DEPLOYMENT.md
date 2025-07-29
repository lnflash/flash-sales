# DigitalOcean App Platform Deployment Guide

## Required Environment Variables

When deploying to DigitalOcean App Platform, you need to configure the following environment variables:

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep this secret!)
- `SUPABASE_PROJECT_ID` - Your Supabase project ID
- `DATABASE_URL` - Your Supabase database connection string

### Application Configuration
- `NEXT_PUBLIC_USE_SUPABASE` - Set to `true` to enable Supabase
- `NEXT_PUBLIC_APP_ENV` - Set to `production`
- `NEXT_PUBLIC_APP_URL` - Your app's URL (e.g., `https://your-app.ondigitalocean.app`)

### Optional Configuration
- `NEXT_PUBLIC_GRAPHQL_URI` - Custom GraphQL endpoint (defaults to `https://api.flashapp.me/graphql`)
- `NEXT_PUBLIC_API_BASE_URL` - Custom API base URL

## CORS Issues

If you encounter CORS errors when trying to authenticate:

1. The app includes a GraphQL proxy at `/api/graphql-proxy` that automatically handles CORS issues for DigitalOcean deployments
2. The proxy is automatically used when the app detects it's running on `ondigitalocean.app`
3. If you still have issues, contact the Flash API team to whitelist your domain

## Deployment Steps

1. Fork/clone this repository to your GitHub account
2. Create a new app on DigitalOcean App Platform
3. Connect your GitHub repository
4. Add all the environment variables listed above
5. Deploy the app
6. Test the authentication on your deployed URL

## Troubleshooting

### "Supabase environment variables not found" error
- Make sure all `NEXT_PUBLIC_*` variables are added to your DigitalOcean app
- Redeploy after adding environment variables

### Login fails with network error
- Check browser console for CORS errors
- The GraphQL proxy should handle this automatically
- If issues persist, check that the Flash API is accessible

### Profile page shows mock data
- Verify that Supabase environment variables are correctly set
- Check that the user exists in your Supabase database
- Look for console errors related to Supabase queries