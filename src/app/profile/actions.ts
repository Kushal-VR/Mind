"use server";

import { createClient } from "@/supabase/server";

export async function getMyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch user data (including total_xp)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, name, full_name, bio, website, avatar_url, user_xp")
    .eq("id", user.id)
    .single();

  if (userError || !userData) return null;

  // 2. Fetch global progress
  const { data: globalProgress } = await supabase
    .from("user_global_progress")
    .select("global_xp, global_level, league")
    .eq("user_id", user.id)
    .single();

  // 3. Calculate Learning XP
  const { data: learningQuests } = await supabase
    .from("user_learning_quests")
    .select("xp_reward")
    .eq("user_id", user.id)
    .eq("completed", true);
  
  const learningXP = (learningQuests || []).reduce((sum, q) => sum + (q.xp_reward || 0), 0);

  // 4. Calculate Side Quest XP
  // Fetch completed side quest progress
  const { data: qProgress } = await supabase
    .from("user_quest_progress")
    .select("quest_id")
    .eq("user_id", user.id)
    .eq("completed", true);
  
  const sideQuestIds = (qProgress || []).map(p => p.quest_id);
  let sideQuestXP = 0;
  if (sideQuestIds.length > 0) {
    const { data: sQuests } = await supabase
      .from("quests")
      .select("xp_reward")
      .in("id", sideQuestIds);
    sideQuestXP = (sQuests || []).reduce((sum, q) => sum + (q.xp_reward || 0), 0);
  }

  // 5. Fetch ALL fields
  const { data: allFields } = await supabase
    .from("fields")
    .select("id, name");

  // 6. Fetch field progress (all progress)
  const { data: fieldProgress } = await supabase
    .from("user_field_progress")
    .select("field_id, field_xp, field_level, unlocked")
    .eq("user_id", user.id);

  // 7. Fetch follower/following counts
  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", user.id);

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id);

  // Process fields to ensure complete dataset for radar chart
  const processedFields = (allFields || []).map(field => {
    const progress = (fieldProgress || []).find(p => p.field_id === field.id);
    return {
      id: field.id,
      name: field.name,
      level: progress ? progress.field_level : 1, // Default to level 1
      xp: progress ? progress.field_xp : 0,
      unlocked: progress ? progress.unlocked : false
    };
  });

  // Calculate Active Field (Highest XP)
  const activeField = [...processedFields].sort((a, b) => b.xp - a.xp)[0];

  const maxLevel = Math.max(...processedFields.map(f => f.level), 1);

  return {
    user: userData,
    globalProgress,
    fieldProgress: processedFields,
    activeField,
    maxLevel,
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
    learningXP,
    sideQuestXP
  };
}
