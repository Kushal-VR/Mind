import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  // 1. Fetch all today's daily quests (not penalty) using date range
  const { data: todaysDailyQuests, error: questError } = await supabase
    .from("quests")
    .select("id")
    .gte("for_date", startOfDay.toISOString())
    .lte("for_date", endOfDay.toISOString())
    .neq("type", "penalty")
    .eq("user_id", user.id);
  const todaysDailyQuestIds = (todaysDailyQuests || []).map(q => q.id);

  // 2. Fetch all completed progress for those quest IDs (Side Quests)
  let dailyCompleted = 0;
  if (todaysDailyQuestIds.length > 0) {
    const { data: completedProgress } = await supabase
      .from("user_quest_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .in("quest_id", todaysDailyQuestIds);
    dailyCompleted = (completedProgress || []).length;
  }

  // 3. Fetch today's completed Learning Quests
  const { data: todaysLearningQuests } = await supabase
    .from("user_learning_quests")
    .select("id")
    .eq("user_id", user.id)
    .eq("completed", true)
    .gte("completed_at", startOfDay.toISOString())
    .lte("completed_at", endOfDay.toISOString());

  // Merge today's completion stats
  // Note: dailyTotal remains 9 for side quests, but we add learning quests to completion count
  dailyCompleted += (todaysLearningQuests || []).length;
  const dailyTotal = 9; // Side quest limit is 9, learning quests are extra

  // 4. Fetch all-time completed quests for the user (Both Side and Learning)
  const [{ count: sideCount }, { count: learningCount }] = await Promise.all([
    supabase
      .from("user_quest_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true),
    supabase
      .from("user_learning_quests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true)
  ]);

  const totalCompleted = (sideCount || 0) + (learningCount || 0);

  return NextResponse.json({
    dailyCompleted,
    dailyTotal,
    totalCompleted,
  });
}