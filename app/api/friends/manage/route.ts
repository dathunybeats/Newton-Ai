import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Accept or reject a friend request
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { friendshipId, action } = await request.json();

        if (!friendshipId || !action || !["accept", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // Verify the friendship exists and user is the recipient
        const { data: friendship, error: fetchError } = await supabase
            .from("friendships")
            .select("*")
            .eq("id", friendshipId)
            .eq("friend_id", user.id)
            .eq("status", "pending")
            .single();

        if (fetchError || !friendship) {
            return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
        }

        const newStatus = action === "accept" ? "accepted" : "rejected";

        const { data: updated, error: updateError } = await supabase
            .from("friendships")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", friendshipId)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating friendship:", updateError);
            return NextResponse.json({ error: "Failed to update friend request" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            friendship: updated,
            message: action === "accept" ? "Friend request accepted" : "Friend request rejected"
        });

    } catch (error) {
        console.error("Error responding to friend request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Remove a friend or cancel a request
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { friendshipId } = await request.json();

        if (!friendshipId) {
            return NextResponse.json({ error: "Friendship ID is required" }, { status: 400 });
        }

        // Verify the friendship exists and user is involved
        const { data: friendship, error: fetchError } = await supabase
            .from("friendships")
            .select("*")
            .eq("id", friendshipId)
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .single();

        if (fetchError || !friendship) {
            return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
        }

        const { error: deleteError } = await supabase
            .from("friendships")
            .delete()
            .eq("id", friendshipId);

        if (deleteError) {
            console.error("Error deleting friendship:", deleteError);
            return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Friendship removed successfully"
        });

    } catch (error) {
        console.error("Error removing friendship:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
