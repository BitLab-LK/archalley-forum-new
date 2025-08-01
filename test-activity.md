# Activity Feed Testing Guide

## How to Test Activity Tracking

### 1. Test Vote Activities
1. Go to homepage (http://localhost:3001)
2. Log in with a user account
3. Vote on a post (like/dislike)
4. Go to your profile page
5. Check the "Recent Activity" section - should show the vote activity

### 2. Test Comment Activities  
1. Go to homepage
2. Click on a post to open modal
3. Add a comment
4. Go to your profile page
5. Check the "Recent Activity" section - should show the comment activity

### 3. Test Real-time Updates
1. Open your profile in one tab
2. Open homepage in another tab
3. Vote or comment on posts
4. Switch back to profile tab
5. Click "Refresh" button or wait 30 seconds for auto-refresh
6. Should see new activities appear

### 4. Test Activity Feed Features
- **Auto-refresh**: Activities update every 30 seconds when page is visible
- **Manual refresh**: Click the "Refresh" button
- **Pagination**: Shows 10 activities per page with "Load More" option
- **Activity types**: Post creation, votes (likes/dislikes), comments
- **Real-time**: New activities appear without page reload

## Current Improvements Made

1. **Better Data Fetching**: Now fetches activities from last 30 days with proper chronological ordering
2. **Real-time Updates**: Auto-refresh every 30 seconds + manual refresh button  
3. **Improved Pagination**: Proper offset-based pagination instead of slice-based
4. **Better UI**: Refresh button with loading indicator
5. **Activity Timing**: Shows accurate "time ago" for each activity

## API Endpoints
- `GET /api/users/[id]/activity` - Fetch user activities
- Parameters: `page`, `limit`, `t` (timestamp for cache busting)

## Database Tables Used
- `votes` - For like/dislike activities
- `comment` - For comment activities  
- `post` - For post creation activities

## Activity Types Tracked
- `post_created` - When user creates a new post
- `post_liked` - When user likes a post
- `post_disliked` - When user dislikes a post
- `comment_created` - When user comments on a post
