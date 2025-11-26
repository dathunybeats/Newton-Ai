import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/rooms - List all active rooms
export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Fetch active public rooms
        const { data: rooms, error: roomsError } = await supabase
            .from("rooms")
            .select("id, name, privacy, created_at, creator_id")
            .eq("is_active", true)
            .eq("privacy", "public")
            .order("created_at", { ascending: false });

        if (roomsError) {
            console.error("Error fetching rooms:", roomsError);
            return NextResponse.json({
                error: "Failed to fetch rooms",
                details: roomsError.message
            }, { status: 500 });
        }

        // If no rooms, return empty array
        if (!rooms || rooms.length === 0) {
            return NextResponse.json({ rooms: [] });
        }

        // For each room, get participant count and tags
        const roomsWithDetails = await Promise.all(
            rooms.map(async (room) => {
                // Get active participant count
                const { count: participantCount } = await supabase
                    .from("room_participants")
                    .select("*", { count: "exact", head: true })
                    .eq("room_id", room.id)
                    .eq("is_active", true);

                // Get tags
                const { data: tagsData } = await supabase
                    .from("room_tags")
                    .select("tag")
                    .eq("room_id", room.id);

                const tags = tagsData?.map(t => t.tag) || [];

                return {
                    id: room.id,
                    name: room.name,
                    privacy: room.privacy,
                    participants: participantCount || 0,
                    tags,
                    created_at: room.created_at,
                };
            })
        );

        return NextResponse.json({ rooms: roomsWithDetails });

    } catch (error: any) {
        console.error("Error in rooms API:", error);
        return NextResponse.json({
            error: "Internal server error",
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
