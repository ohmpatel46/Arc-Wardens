# Gmail Reply Detection - Quick Guide

## How It Works

1. **Send Emails**: Create a campaign and pay $0.1 to activate it. The system sends emails to your contacts via Gmail API.

2. **Check for Replies**: 
   - Go to **Analytics Tab** (chart icon in sidebar)
   - Select your active campaign
   - Click the **"Refresh"** button in the top right

3. **View Replies**: 
   - A green **"Replies Received!"** card will appear at the top
   - Shows all contacts who have replied
   - Displays their email, subject, and message preview
   - The main table below also shows "Replied" status

## Technical Flow

### Backend (`tools/registry.py` - `check_replies` action):
- Uses Gmail API to scan last 50 inbox messages
- Matches sender emails against campaign contacts
- Returns list of replies with email, subject, date, and snippet

### Frontend (`CampaignAnalyticsView.jsx`):
- Calls `/api/campaigns/{id}/verify_status` endpoint
- Displays replies in a prominent green card
- Updates table status to show "Replied" badge

## Test It

1. Send emails from a campaign (they go to thevoiceprecis@gmail.com and panopticnotes@gmail.com)
2. Reply to one of those emails from your Gmail
3. Click "Refresh" in Analytics
4. The reply will appear immediately

## Port Configuration
- Frontend: http://localhost:3000
- Backend: http://localhost:5001
