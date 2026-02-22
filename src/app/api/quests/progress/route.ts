import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch side quest progress
  const { data: sideQuestProgress, error: sideError } = await supabase
    .from("user_quest_progress")
    .select("*")
    .eq("user_id", user.id);

  if (sideError) {
    return NextResponse.json({ 
      error: sideError.message 
    }, { status: 500 });
  }

  return NextResponse.json({ progress: sideQuestProgress || [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { quest_id, progress } = body;

  // SIDE QUEST LOGIC - Use user_quest_progress (UNCHANGED)
  // Note: We've removed the core quest logic as it's now handled by learning paths actions.

  const { error } = await supabase.from("user_quest_progress").upsert(
    [
      {
        user_id: user.id,
        quest_id,
        progress,
        completed: progress >= 100,
        completed_at: progress >= 100 ? new Date().toISOString() : null,
      },
    ],
    {
      onConflict: "user_id,quest_id",
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If completed, also update the quest's status
  if (progress >= 100) {
    console.log(`Side quest ${quest_id} completed, updating status`);

    await supabase
      .from("quests")
      .update({ status: "completed" })
      .eq("id", quest_id)
      .eq("user_id", user.id);

    // Fetch quest metadata for XP calculation
    const { data: sideQuest } = await supabase
      .from("quests")
      .select("xp_reward")
      .eq("id", quest_id)
      .eq("user_id", user.id)
      .single();

    if (sideQuest && sideQuest.xp_reward) {
      // Fetch level requirements
      const { data: levels } = await supabase
        .from("user_levels")
        .select("*")
        .order("level", { ascending: true });

      const calculateLevel = (xp: number) => {
        let level = 1;
        if (levels && levels.length > 0) {
          for (let i = 0; i < levels.length; i++) {
            if (xp >= levels[i].xp_required) {
              level = levels[i].level;
            } else {
              break;
            }
          }
        }
        return level;
      };

      // Side Quest: 70% Global XP only
      const { data: globalProgress } = await supabase
        .from("user_global_progress")
        .select("global_xp, global_level")
        .eq("user_id", user.id)
        .single();

      if (globalProgress) {
        const globalXPReward = Math.round(sideQuest.xp_reward * 0.7);
        const newGlobalXP = (globalProgress.global_xp || 0) + globalXPReward;
        const newGlobalLevel = calculateLevel(newGlobalXP);

        await supabase
          .from("user_global_progress")
          .update({
            global_xp: newGlobalXP,
            global_level: newGlobalLevel,
          })
          .eq("user_id", user.id);

        console.log(`Awarded ${globalXPReward} Global XP for Side Quest`);
      }

      // Also update users.user_xp (legacy field)
      await supabase.rpc("increment_user_xp", {
        user_id: user.id,
        xp_amount: sideQuest.xp_reward,
      });
    }
  }

  return NextResponse.json({ success: true });
}
