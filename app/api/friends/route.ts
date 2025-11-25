import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Get all friends and pending requests
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all friendships where user is involved
        const { data: friendships, error: friendshipsError } = await supabase
            .from("friendships")
            .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        updated_at
      `)
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .order("created_at", { ascending: false });

        if (friendshipsError) {
            console.error("Error fetching friendships:", friendshipsError);
            return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
        }

        if (!friendships || friendships.length === 0) {
            return NextResponse.json({
                friends: [],
                pendingReceived: [],
                pendingSent: [],
            });
        }

        // Get friend IDs
        const friendIds = friendships.map(f =>
            f.user_id === user.id ? f.friend_id : f.user_id
        );

        // Get profiles for friends
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", friendIds);

        // Combine friendship data with profile data
        const friendsWithProfiles = await Promise.all(friendships.map(async (friendship) => {
            const friendId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
            const profile = profiles?.find(p => p.id === friendId);
            const isSender = friendship.user_id === user.id;

            // If no profile, try to get user from auth
            let name = profile?.full_name || "Unknown User";
            let avatar = profile?.avatar_url;

            if (!profile?.full_name) {
                // Try to get user metadata from auth
                const { data: { user: friendUser } } = await supabase.auth.admin.getUserById(friendId);
                if (friendUser) {
                    name = friendUser.user_metadata?.full_name || friendUser.email?.split('@')[0] || "Unknown User";
                    avatar = friendUser.user_metadata?.avatar_url || avatar;
                }
            }

            return {
                id: friendship.id,
                friendId,
                name,
                avatar,
                status: friendship.status,
                isSender,
                createdAt: friendship.created_at,
            };
        }));

        // Separate into categories
        const accepted = friendsWithProfiles.filter(f => f.status === "accepted");
        const pending = friendsWithProfiles.filter(f => f.status === "pending");
        const received = pending.filter(f => !f.isSender);
        const sent = pending.filter(f => f.isSender);

        return NextResponse.json({
            friends: accepted,
            pendingReceived: received,
            pendingSent: sent,
        });

    } catch (error) {
        console.error("Error in friends list:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
