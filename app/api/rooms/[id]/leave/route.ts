import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/rooms/[id]/leave - Leave a room
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: roomId } = await params;

        // Mark participation as inactive
        const { error: leaveError } = await supabase
            .from("room_participants")
            .update({
                is_active: false,
                left_at: new Date().toISOString(),
            })
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .eq("is_active", true);

        if (leaveError) {
            console.error("Error leaving room:", leaveError);
            return NextResponse.json({ error: "Failed to leave room" }, { status: 500 });
        }

        // Check if room is now empty
        const { count: remainingParticipants } = await supabase
            .from("room_participants")
            .select("*", { count: "exact", head: true })
            .eq("room_id", roomId)
            .eq("is_active", true);

        // If room is empty, close it
        if (remainingParticipants === 0) {
            await supabase
                .from("rooms")
                .update({
                    is_active: false,
                    closed_at: new Date().toISOString(),
                })
                .eq("id", roomId);
        }

        return NextResponse.json({
            message: "Left room successfully",
        });

    } catch (error) {
        console.error("Error in room leave:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
