# Friends System Implementation

## Overview
Implemented a complete friends system with email-based invitations, replacing the mock data.

## Database Schema

### Friendships Table
```sql
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  friend_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT friendships_unique_pair UNIQUE (user_id, friend_id),
  CONSTRAINT friendships_no_self_friend CHECK (user_id != friend_id)
);
```

## API Routes

### 1. Send Friend Request
**POST** `/api/friends/request`
- Body: `{ email: string }`
- Finds user by email and creates a pending friendship request
- Returns error if user not found, already friends, or request already sent

### 2. Get Friends List
**GET** `/api/friends`
- Returns:
  - `friends`: Accepted friendships
  - `pendingReceived`: Friend requests you've received
  - `pendingSent`: Friend requests you've sent

### 3. Manage Friendships
**PATCH** `/api/friends/manage`
- Body: `{ friendshipId: string, action: 'accept' | 'reject' }`
- Accept or reject friend requests

**DELETE** `/api/friends/manage`
- Body: `{ friendshipId: string }`
- Remove a friend or cancel a request

## UI Features

### Friends Card
- Shows count of friends and pending requests
- Displays pending friend requests with Accept/Reject buttons
- Shows list of accepted friends
- Empty state when no friends

### Add Friend Modal
- Clean, simple email input
- Real-time error messages
- Loading state while sending request
- Keyboard support (Enter to send)

## How to Use

1. **Run the migration**: The friendships table needs to be created in Supabase
   ```bash
   # Apply the migration in Supabase dashboard or CLI
   ```

2. **Add a friend**:
   - Click the "+" button in the Friends card
   - Enter friend's email address
   - Click "Send Friend Request"

3. **Accept/Reject requests**:
   - Pending requests appear at the top of the Friends list
   - Click the green checkmark to accept
   - Click the red X to reject

## Next Steps (Optional)
- Add real-time presence (show who's online/studying)
- Add friend activity feed
- Add ability to study together in rooms
- Add friend search by username (in addition to email)
