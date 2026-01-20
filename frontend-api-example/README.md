# Frontend Email Verification Implementation

This directory contains Next.js frontend code for email verification functionality.

## Files Structure

```
frontend-api-example/
├── lib/
│   └── api/
│       └── auth.ts              # API client functions
├── app/
│   ├── verify-email/
│   │   └── page.tsx             # Email verification page
│   └── signup/
│       └── page-example.tsx     # Example signup page
└── components/
    └── SignupSuccess.tsx        # Signup success component
```

## Setup Instructions

### 1. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### 2. Install Dependencies

Make sure you have these in your `package.json`:

```json
{
  "dependencies": {
    "next": "^13.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### 3. Copy Files to Your Next.js Project

1. Copy `lib/api/auth.ts` to your `lib/api/` directory
2. Copy `app/verify-email/page.tsx` to your `app/verify-email/` directory
3. Copy `components/SignupSuccess.tsx` to your `components/` directory
4. Integrate the signup flow from `app/signup/page-example.tsx` into your existing signup page

### 4. Update Path Aliases (if needed)

If your project uses different path aliases, update the imports:

- `@/lib/api/auth` → your API path
- `@/components/SignupSuccess` → your components path

## Usage

### Signup Flow

1. User signs up
2. After successful signup, show `SignupSuccess` component
3. User checks email and clicks verification link
4. User is redirected to `/verify-email?token=...`
5. Verification page handles the token and shows success/error

### API Functions

```typescript
import { signup, verifyEmail, resendVerificationEmail } from '@/lib/api/auth';

// Signup
const result = await signup(username, email, password);

// Verify email
const result = await verifyEmail(token);

// Resend verification
const result = await resendVerificationEmail(email);
```

## Features

- ✅ Email verification page with token handling
- ✅ Signup success page with resend functionality
- ✅ Error handling and user feedback
- ✅ Rate limit handling for resend requests
- ✅ Loading states and animations
- ✅ Responsive design with Tailwind CSS

## Styling

The components use Tailwind CSS. Make sure Tailwind is configured in your Next.js project:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of config
}
```

## Customization

- Update colors in Tailwind classes to match your brand
- Modify error messages to match your tone
- Adjust redirect timing in `verify-email/page.tsx`
- Customize email verification expiry message
