# Budget Files Storage Setup

## Overview
The budget request form includes file upload functionality for quotations and supporting documents. Files are stored in Supabase Storage in the `budget-files` bucket.

## Automatic Setup
The application automatically sets up the `budget-files` bucket on first upload if it doesn't exist. This is handled by:
- Client calls `POST /api/storage/setup-budget-bucket` endpoint
- Server uses Supabase admin credentials to create bucket
- Bucket is created with proper security settings and file type restrictions

**Bucket Configuration:**
- **Name**: `budget-files`
- **Public Access**: Enabled (files are downloadable publicly)
- **Max File Size**: 10MB per file
- **Supported Types**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Images (.jpg, .png)

## Manual Setup (Optional)

If the automatic setup fails, you can manually trigger bucket creation via:

### Option 1: Using cURL
```bash
curl -X POST http://localhost:3000/api/storage/setup-budget-bucket \
  -H "Content-Type: application/json"
```

### Option 2: Using JavaScript
```javascript
fetch('/api/storage/setup-budget-bucket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log(data));
```

### Option 3: Manual Dashboard Setup

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar

### Step 2: Create the Bucket
1. Click **Create a new bucket**
2. Enter bucket name: `budget-files`
3. Enable **Public bucket** toggle
4. Click **Create bucket**

### Step 3: Configure File Size Limit
1. Open the `budget-files` bucket settings (click the bucket name)
2. Set max file size to **10 MB**
3. Add allowed MIME types:
   - `application/pdf`
   - `application/msword`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - `application/vnd.ms-excel`
   - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `image/jpeg`
   - `image/png`

### Step 4: Apply RLS Policies
Run the migration in your Supabase project to apply Row-Level Security policies:
```bash
npm run supabase migration up
```

Or manually apply from `supabase/migrations/20260607_create_budget_files_bucket.sql`

## Features

### Upload Quotations
- Click "Upload Quotations" in the budget request dialog
- Select one or more files (PDF, Word, Excel, or images)
- Files are automatically uploaded and linked to the budget request
- Max 10MB per file

### Manage Files
- **Download**: Click the download icon to view/download a file
- **Delete**: Click the trash icon to remove a file from the request
- **View Metadata**: See file name, size, and upload time

### Storage Location
Files are organized in the following structure:
```
budget-files/
└── quotations/
    ├── [timestamp]-[random].pdf
    ├── [timestamp]-[random].docx
    └── ...
```

## Error Handling

### Upload Failures

#### Error: "Storage bucket not configured"
The automatic bucket creation failed. This can happen if:
1. **Server credentials missing** - `SUPABASE_SERVICE_ROLE_KEY` not set on server
2. **Server unreachable** - Backend API not available
3. **Bucket creation denied** - Permission issues with Supabase credentials

**Solution**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in your server environment
2. Check that the development server is running (`npm run dev`)
3. Try accessing the setup endpoint manually:
   ```bash
   curl -X POST http://localhost:3000/api/storage/setup-budget-bucket
   ```

#### Error: "Failed to upload [filename]: Unknown error"
General upload failure. Possible causes:
1. **File size** - File exceeds 10MB limit
2. **File type** - Not one of: PDF, Word, Excel, Images
3. **Network error** - Check internet connection
4. **Storage quota** - Supabase storage limit reached

**Solution**:
- Check file details in console (F12)
- Verify file format and size
- Try refreshing and uploading again
- Contact support if quota is exceeded

### Troubleshooting Steps
1. **Check Server Status**
   - Is the development server running? (`npm run dev`)
   - Check terminal for errors

2. **Verify Environment**
   - Ensure `SUPABASE_URL` is set in .env
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (⚠️ backend only)
   - Restart the development server after changing environment

3. **Test Bucket Endpoint**
   ```bash
   # Test if the setup endpoint is working
   curl -X POST http://localhost:3000/api/storage/setup-budget-bucket
   
   # Expected response (success)
   {"success":true,"message":"Budget files bucket created successfully","bucket":"budget-files"}
   ```

4. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages related to upload
   - Network tab shows request/response details

5. **Verify Supabase Credentials**
   - Service Role Key is found in: Supabase Dashboard → Settings → API
   - ⚠️ Never commit this to version control
   - Only needed on backend (server.ts)

6. **Check Storage Bucket**
   - Visit Supabase Dashboard → Storage
   - Verify `budget-files` bucket exists
   - Check bucket settings for file size limits

## Environment Requirements

### Server-Side Setup
The automatic bucket creation feature requires these environment variables on the server:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (admin credentials)

These are used by the `/api/storage/setup-budget-bucket` endpoint to create buckets with admin permissions.

**⚠️ Important**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or `.env` files you commit to version control.

### Client-Side Setup
The frontend only needs standard Supabase credentials:
- `VITE_SUPABASE_URL` 
- `VITE_SUPABASE_ANON_KEY`

## API Endpoint

### POST /api/storage/setup-budget-bucket

**Purpose**: Creates the `budget-files` storage bucket if it doesn't exist

**Request**:
```bash
POST /api/storage/setup-budget-bucket
Content-Type: application/json
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Budget files bucket created successfully",
  "bucket": "budget-files"
}
```

**Response (Already Exists)**:
```json
{
  "success": true,
  "message": "Budget files bucket already exists",
  "bucket": "budget-files"
}
```

**Response (Error)**:
```json
{
  "error": "Failed to create storage bucket",
  "details": "Error message here"
}
```

## Environment Configuration

## Security Notes
- Files are stored in a public bucket but with authenticated upload requirements
- Deletion requires authentication
- File access is unrestricted for public viewing (RLS policy: "Public Read Access")
- Consider adding additional access controls if needed for sensitive quotations

## API Reference

### Upload a File
```typescript
const { data, error } = await supabase.storage
  .from('budget-files')
  .upload('quotations/filename.pdf', file);
```

### Get File URL
```typescript
const { data } = supabase.storage
  .from('budget-files')
  .getPublicUrl('quotations/filename.pdf');
```

### Delete a File
```typescript
const { error } = await supabase.storage
  .from('budget-files')
  .remove(['quotations/filename.pdf']);
```

## Related Files
- Component: `src/components/budget/BudgetRequestsTab.tsx`
- Migration: `supabase/migrations/20260607_create_budget_files_bucket.sql`
