import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/rooms/[id]/join - Join a room
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

        // Check if room exists and is active
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", roomId)
            .eq("is_active", true)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Check if room is full
        const { count: participantCount } = await supabase
            .from("room_participants")
            .select("*", { count: "exact", head: true })
            .eq("room_id", roomId)
            .eq("is_active", true);

        if (participantCount && participantCount >= room.max_participants) {
            return NextResponse.json({ error: "Room is full" }, { status: 403 });
        }

        // Check if user is already in another active room
        const { data: activeParticipation } = await supabase
            .from("room_participants")
            .select("room_id")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .single();

        if (activeParticipation) {
            return NextResponse.json({
                error: "You are already in another room. Please leave it first."
            }, { status: 403 });
        }

        // Join the room
        const { error: joinError } = await supabase
            .from("room_participants")
            .insert({
                room_id: roomId,
                user_id: user.id,
                is_active: true,
            });

        if (joinError) {
            console.error("Error joining room:", joinError);
            return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
        }

        return NextResponse.json({
            message: "Joined room successfully",
            roomId,
        });

    } catch (error) {
        console.error("Error in room join:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
