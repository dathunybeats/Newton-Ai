import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/rooms/create - Create a new room
export async function POST(request: Request) {
    console.log("=== Create room API called ===");

    try {
        const body = await request.json();
        console.log("Request body:", body);

        const { name, privacy = "public", tags = [] } = body;

        // Validation
        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Room name is required" }, { status: 400 });
        }

        // Create Supabase client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("Auth error:", authError);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Creating room for user:", user.id);

        // Create room
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .insert({
                name: name.trim(),
                creator_id: user.id,
                privacy,
            })
            .select()
            .single();

        if (roomError) {
            console.error("Error creating room:", roomError);
            return NextResponse.json({
                error: "Failed to create room",
                details: roomError.message
            }, { status: 500 });
        }

        console.log("Room created:", room.id);

        // Add tags if provided
        if (tags.length > 0 && room) {
            const roomTags = tags.slice(0, 5).map((tag: string) => ({
                room_id: room.id,
                tag: tag.trim(),
            }));

            const { error: tagsError } = await supabase
                .from("room_tags")
                .insert(roomTags);

            if (tagsError) {
                console.error("Error adding tags:", tagsError);
                // Continue anyway - tags are not critical
            }
        }

        // Automatically join the creator to the room
        const { error: joinError } = await supabase
            .from("room_participants")
            .insert({
                room_id: room.id,
                user_id: user.id,
                is_active: true,
            });

        if (joinError) {
            console.error("Error joining room:", joinError);
            // Continue anyway - we can join later
        }

        return NextResponse.json({
            room: {
                id: room.id,
                name: room.name,
                privacy: room.privacy,
                participants: 1,
                tags,
            }
        });

    } catch (error: any) {
        console.error("Error in create room:", error);
        return NextResponse.json({
            error: "Internal server error",
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
