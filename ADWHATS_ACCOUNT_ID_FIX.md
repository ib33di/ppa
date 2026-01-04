# Fix AdWhats Account ID Configuration

## Problem
Error message: `Account ID 1 not found. Available accounts: 8249`

This means your `ADWHATS_ACCOUNT_ID` environment variable is set to `1`, but your actual AdWhats account ID is `8249`.

## Solution

### For Render (Production)

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service (`ppa-backend-tfjj`)
3. Go to **Environment** tab
4. Find `ADWHATS_ACCOUNT_ID` variable
5. Change its value from `1` to `8249`
6. Click **Save Changes**
7. Render will automatically restart your service

### For Local Development

1. Open `backend/.env` file
2. Find the line: `ADWHATS_ACCOUNT_ID=1`
3. Change it to: `ADWHATS_ACCOUNT_ID=8249`
4. Save the file
5. Restart your backend server

## Verify the Fix

After updating the Account ID, try sending an invitation again. The error should be resolved.

## How to Find Your Account ID

If you're not sure what your Account ID is:

1. The error message will show available accounts: `Available accounts: 8249`
2. Or check your AdWhats dashboard
3. Or use the API to get accounts:
   ```bash
   curl -X GET https://api.adwhats.net/accounts \
     -H "token: YOUR_API_TOKEN"
   ```

## Important Notes

- The Account ID is a number (not a string)
- Make sure there are no spaces around the value
- After changing environment variables in Render, wait for the service to restart
- The verification function will automatically check if the Account ID exists and is ready

