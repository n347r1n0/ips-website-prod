# Telegram Auth Callback Edge Function

This Supabase Edge Function handles the server-side logic for Telegram OAuth2 authentication flow.

## Overview

The function implements a complete 8-step OAuth2 flow:

1. **Code Exchange**: Exchanges the authorization code for an access token
2. **Profile Fetching**: Retrieves user profile data from Telegram API
3. **User Lookup**: Checks if user exists in the system
4. **User Creation**: Creates new auth user if needed (with placeholder email)
5. **Profile Creation**: Creates club member profile in database
6. **Link Generation**: Generates secure sign-in link for frontend
7. **Token Extraction**: Extracts access/refresh tokens
8. **Redirect Response**: Returns redirect URL with authentication tokens

## API Endpoint

**POST** `/functions/v1/telegram-auth-callback`

### Request Body

```json
{
  "code": "telegram_auth_code_from_oauth_flow",
  "redirect_uri": "https://your-site.com/auth/telegram/callback", 
  "frontend_url": "https://your-site.com"
}
```

### Success Response

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "telegram_123456@placeholder.local",
    "telegram_id": 123456,
    "telegram_username": "username",
    "telegram_first_name": "First Name"
  },
  "tokens": {
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token", 
    "expires_in": 3600
  },
  "redirect_url": "https://your-site.com/dashboard?telegram_auth=success&access_token=...",
  "action_link": "https://project.supabase.co/auth/v1/verify?token=..."
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Environment Variables

Set these in your Supabase Dashboard under Settings > Edge Functions:

- `TELEGRAM_CLIENT_ID`: Your Telegram Bot ID (numeric)
- `TELEGRAM_CLIENT_SECRET`: Your Telegram Bot Token
- `TELEGRAM_TOKEN_URL`: OAuth token endpoint (default: https://oauth.telegram.org/auth)
- `TELEGRAM_API_URL`: Telegram API base URL (default: https://api.telegram.org)

## Database Requirements

The function expects these database tables:

### `auth.users`
Standard Supabase auth table with user_metadata for Telegram info.

### `public.club_members`
```sql
CREATE TABLE club_members (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nickname VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## User Creation Logic

- **New Users**: Creates placeholder email format `telegram_{telegram_id}@placeholder.local`
- **Existing Users**: Updates metadata with latest Telegram profile info
- **Club Profile**: Automatically creates club_members record with Telegram username/first_name as nickname

## Security Features

- CORS headers configured for cross-origin requests
- Service role key used for admin operations
- Secure random passwords for placeholder accounts
- Auto-confirmed email for Telegram users
- Error messages sanitized to prevent information leakage

## Deployment

```bash
# Deploy the function
supabase functions deploy telegram-auth-callback

# Set environment variables
supabase secrets set TELEGRAM_CLIENT_ID=your_bot_id
supabase secrets set TELEGRAM_CLIENT_SECRET=your_bot_token
```

## Frontend Integration

The function returns a `redirect_url` that contains the access and refresh tokens. Your frontend should:

1. Redirect the user to this URL after successful OAuth
2. Extract tokens from URL parameters
3. Use tokens to authenticate with your Supabase client
4. Redirect to dashboard or desired page

Example frontend handling:

```javascript
// Extract tokens from URL
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');

// Set session in Supabase client
if (accessToken && refreshToken) {
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });
}
```