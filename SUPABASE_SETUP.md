# Supabase Service Credentials Setup Guide

## Problem
The server cannot update user passwords because the Supabase service role key is not configured.

## Solution

### Step 1: Get Your Service Role Key from Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (alheib-school)
3. Navigate to **Settings** → **API**
4. Copy the **Service Role Key** (NOT the Anon Public Key)
   - ⚠️ Keep this secret! Only use it on the backend server.

### Step 2: Set Environment Variable

Choose ONE of these methods:

#### Option A: Using `.env.local` (Development)
Create a `.env.local` file in your project root:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Then run:
```bash
npm run dev
```

#### Option B: Using `.env` file (Docker/Production)
Create or update `.env` file:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Then run the server:
```bash
npm run build && npm start
```

#### Option C: Using System Environment Variables (Linux/Mac)
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
npm run dev
```

#### Option D: Using Docker (Container)
When running Docker, pass the environment variables:
```bash
docker run -e SUPABASE_URL="https://your-project.supabase.co" \
           -e SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here" \
           your-image:latest
```

### Step 3: Verify Setup

Test if the server recognizes the credentials:

```bash
curl -X POST http://localhost:3000/api/users/update-password \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "password": "test"}'
```

**If working:**
```json
{"error": "Could not find a user with the given identity"}
```

**If NOT working (missing credentials):**
```json
{"error": "Supabase service credentials are not configured on the server"}
```

## Backend Password Update Endpoint

Once credentials are configured, you can use:

```typescript
// From UserManagement.tsx or director/UserManagement.tsx
const updateUserPassword = async (userId: string, newPassword: string) => {
  const response = await fetch("/api/users/update-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, password: newPassword }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error);
  }
  return data;
};
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit the service role key to git
- Never expose the service role key in frontend code
- Only use it server-side in `server.ts`
- Store in secure environment variable manager (AWS Secrets Manager, Azure Key Vault, etc. for production)

## Troubleshooting

If you still get errors after setting the env var:

1. **Restart the server** after setting the environment variable
2. **Check the env var is loaded:**
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```
3. **Verify Supabase URL matches:**
   - Should be: `https://your-project.supabase.co`
   - NOT: `http://` or localhost addresses
4. **Check network connectivity** to Supabase
5. **Review server logs** for detailed error messages

## For Development with Local Supabase

If using local Supabase (docker):

```bash
# Get service role key from local setup
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_URL="http://127.0.0.1:54321"
```

Then all password updates will use the local Supabase instance.
