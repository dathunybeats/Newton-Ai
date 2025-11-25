import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Use database function to find user by email
        const { data: friendUserId, error: findError } = await supabase
            .rpc('get_user_id_by_email', { user_email: email.toLowerCase() });

        if (findError) {
            console.error("Error finding user:", findError);
            return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
        }

        if (!friendUserId) {
            return NextResponse.json({ error: "User not found with this email" }, { status: 404 });
        }

        if (friendUserId === user.id) {
            return NextResponse.json({ error: "You cannot add yourself as a friend" }, { status: 400 });
        }

        // Check if friendship already exists
        const { data: existing, error: checkError } = await supabase
            .from("friendships")
            .select("*")
            .or(`and(user_id.eq.${user.id},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${user.id})`)
            .maybeSingle();

        if (existing) {
            if (existing.status === "pending") {
                return NextResponse.json({ error: "Friend request already sent" }, { status: 400 });
            }
            if (existing.status === "accepted") {
                return NextResponse.json({ error: "Already friends" }, { status: 400 });
            }
        }

        // Create friendship request
        const { data: friendship, error: createError } = await supabase
            .from("friendships")
            .insert({
                user_id: user.id,
                friend_id: friendUserId,
                status: "pending"
            })
            .select()
            .single();

        if (createError) {
            console.error("Error creating friendship:", createError);
            return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            friendship,
            message: "Friend request sent successfully"
        });

    } catch (error) {
        console.error("Error in friend request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
