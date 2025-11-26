# Live Rooms Backend Architecture Plan

## Overview
Build a scalable, real-time video study room system with optimized performance and minimal latency.

---

## 1. Database Schema (Supabase PostgreSQL)

### Tables

**`rooms`**
- `id` (uuid, primary key)
- `name` (text)
- `creator_id` (uuid, foreign key to users)
- `privacy` (enum: public, private)
- `max_participants` (integer, default 50)
- `is_active` (boolean)
- `created_at`, `updated_at`, `closed_at`
- `settings` (jsonb: allow_chat, allow_video, allow_screenshare, etc.)

**`room_participants`**
- `id` (uuid, primary key)
- `room_id` (uuid, foreign key)
- `user_id` (uuid, foreign key)
- `joined_at`, `left_at`
- `is_active` (boolean)
- `media_state` (jsonb: is_muted, is_video_off, is_screensharing)
- `last_seen_at` (timestamp - for presence tracking)

**`room_tags`**
- `room_id` (uuid)
- `tag` (text)
- Composite primary key (room_id, tag)

**Indexes for Performance:**
- `rooms.is_active` + `rooms.privacy` (for browsing active public rooms)
- `room_participants.room_id` + `room_participants.is_active` (for counting active participants)
- `room_participants.user_id` + `room_participants.is_active` (for finding user's current room)

---

## 2. Real-time Architecture (Supabase Realtime)

### Presence Tracking
- Use Supabase Realtime Presence for live participant tracking
- Track: user online status, current room, media states
- Update `last_seen_at` every 30 seconds
- Auto-remove participants if no heartbeat for 60 seconds

### Live Updates
- Subscribe to `rooms` table changes for room list updates
- Subscribe to `room_participants` for participant join/leave events
- Use Postgres triggers to update participant counts efficiently

### Channel Strategy
- One broadcast channel per room: `room:{room_id}`
- One global channel for lobby: `rooms:lobby`
- Presence channel per room for real-time participant tracking

---

## 3. WebRTC Strategy

### Architecture Choice: **Mesh Network for Small Rooms, SFU for Large Rooms**

**Small Rooms (≤4 participants): Peer-to-peer Mesh**
- Each participant connects directly to every other participant
- No server infrastructure needed
- Lower latency, better quality
- Use simple-peer or PeerJS library
- With video: 4 participants max for stable connections

**Large Rooms (>4 participants): Selective Forwarding Unit (SFU)**
- Use LiveKit or Agora for scalable video infrastructure
- Server routes streams, reducing bandwidth per client
- Better for 5-50 participants
- **Recommended for MVP**: Start with LiveKit (open-source, self-hostable)

### Signaling
- Use Supabase Realtime channels for WebRTC signaling (SDP/ICE exchange)
- Fallback to TURN servers for users behind restrictive NATs

### Media Optimization
- **Default: Audio + Video enabled** (user can disable)
- Video constraints:
  - Default: 480p (640x480), 24fps - optimal for study rooms
  - Optional HD: 720p (1280x720), 30fps - for users with good bandwidth
  - Mobile: 360p (640x360), 15fps - auto-detect mobile devices
- Audio: Opus codec with echo cancellation and noise suppression
- Implement simulcast for adaptive quality (send multiple resolutions)
- Bandwidth estimation: Automatically downgrade quality on poor connections

---

## 4. API Endpoints

### Room Management
- `POST /api/rooms/create` - Create room, return room_id
- `GET /api/rooms/list` - List active rooms (paginated, filtered by tags/privacy)
- `POST /api/rooms/:id/join` - Join room (validate privacy, capacity)
- `POST /api/rooms/:id/leave` - Leave room
- `PATCH /api/rooms/:id/settings` - Update room settings (creator only)
- `DELETE /api/rooms/:id` - Close room (creator only or auto-close when empty)

### Participant Management
- `GET /api/rooms/:id/participants` - List current participants
- `PATCH /api/rooms/:id/media` - Update own media state (mute/unmute, video on/off)

---

## 5. Optimization Strategies

### Database
- **Materialized view** for active room counts (refresh every 10 seconds)
- **Partial indexes** on active rooms only
- **Automatic cleanup**: Cron job to close rooms with no active participants for >5 minutes
- **Pagination**: Limit room list to 20 per page, infinite scroll

### Real-time
- **Throttle presence updates**: Max 1 update per 5 seconds per user
- **Debounce media state changes**: Batch updates within 500ms window
- **Connection pooling**: Reuse Supabase connections

### WebRTC
- **Smart connection**: Establish peer connections on join, but video streams are opt-in per user
- **Resolution switching**:
  - Grid view (4+ people): Automatically use 360p thumbnails
  - Speaker view (1-2 people): Use 480p or 720p
- **Adaptive bitrate**: Automatically lower quality based on:
  - Network conditions (RTT, packet loss)
  - CPU usage
  - Number of active video streams
- **Bandwidth optimization**:
  - Only render visible video tiles (virtual scrolling for 10+ participants)
  - Pause video for off-screen participants
  - Audio continues for all participants
- **TURN server fallback**: Only when direct connection fails

### Caching
- **Room list**: Cache for 5 seconds in Redis/Upstash
- **Participant counts**: Cache with Supabase Realtime presence
- **Static tags**: Preload common tags

---

## 6. Security & Privacy

### Access Control
- Private rooms: Check invite permissions before join
- Row Level Security (RLS) policies on all tables
- Rate limiting: Max 1 room creation per minute per user
- Max 5 room joins per minute to prevent abuse

### Privacy
- Only show participant names/avatars to room members
- Private room existence hidden from non-members
- Optional: Require password for private rooms

### Media Security
- Enforce HTTPS for all signaling
- Use STUN/TURN over TLS
- No recording without all participants' consent

---

## 7. Scalability Considerations

### Current Scale (MVP)
- Handle 100 concurrent rooms
- Average 4-8 participants per room (optimal for video quality)
- ~500-800 concurrent users max with video
- Bandwidth requirements:
  - Per user: ~2-4 Mbps upload, 4-8 Mbps download (with 4 video streams)
  - Server (if using SFU): ~50-100 Mbps for 100 concurrent users

### Future Scale
- Horizontal scaling: Shard rooms by region
- Use CDN for static assets
- Migrate to dedicated SFU (LiveKit/Agora) for 50+ participant rooms
- Implement connection quality monitoring and auto-migration

---

## 8. Implementation Priority

### Phase 1: MVP (Week 1-2)
1. Database schema + migrations
2. Room CRUD APIs
3. Basic join/leave functionality
4. Supabase Realtime integration for presence

### Phase 2: WebRTC (Week 3-4)
1. Integrate LiveKit or implement mesh network with simple-peer
2. Audio + Video capture and streaming
3. Media controls (mute/unmute, video on/off)
4. Grid layout with adaptive quality
5. Connection quality indicators and auto-recovery

### Phase 3: Polish (Week 5)
1. Private room invites
2. Room tags and filtering
3. Performance optimization
4. Error handling and reconnection logic

---

## 9. Tech Stack Summary

**Backend:**
- Supabase (PostgreSQL + Realtime + Auth)
- Next.js API routes
- Optional: Upstash Redis for caching

**WebRTC:**
- **Primary choice**: LiveKit (self-hostable SFU, handles video scaling well)
- **Alternative**: Daily.co or Agora (managed services, faster to implement)
- **Fallback for tiny rooms**: Simple-peer or PeerJS (mesh network, ≤4 people)
- STUN servers (Google's public STUN or Cloudflare)
- TURN servers (Twilio, Cloudflare, or self-hosted coturn)

**Real-time:**
- Supabase Realtime (Presence + Broadcast channels)
- WebSocket fallback for older browsers

---

## 10. Video-Specific Considerations

### Bandwidth Requirements
- **Minimum**: 1.5 Mbps upload / 3 Mbps download
- **Recommended**: 3 Mbps upload / 6 Mbps download
- **Pre-call test**: Check user's bandwidth before joining video room

### Browser Permissions
- Request camera/microphone permissions on room join
- Handle permission denial gracefully (allow audio-only fallback)
- Show clear permission prompts and troubleshooting

### Performance
- **CPU usage monitoring**: Warn users if CPU >80%
- **Frame rate throttling**: Reduce FPS on low-end devices
- **Background blur**: Optional virtual background (increases CPU by 20-30%)

### User Experience
- **Audio priority**: If bandwidth drops, prioritize audio over video
- **Network indicators**: Show connection quality per participant (green/yellow/red)
- **Automatic recovery**: Reconnect dropped streams within 5 seconds
- **Quality settings**: Let users manually select video quality

---

## 11. Key Metrics to Track

- Room creation rate
- Average room duration
- Participant join/leave rate
- Connection quality (packet loss, latency, jitter)
- WebRTC connection success rate
- Video quality metrics (resolution, FPS, bitrate)
- Server costs per concurrent user
- Bandwidth usage per room
