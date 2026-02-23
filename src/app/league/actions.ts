"use server";

import { createClient } from "@/supabase/server";

export async function getLeagueData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch current user's global progress
  const { data: globalProgress, error } = await supabase
    .from("user_global_progress")
    .select("global_xp, global_level, league")
    .eq("user_id", user.id)
    .single();

  if (error || !globalProgress) {
    console.error("Error fetching global progress:", error);
    return null;
  }

  // 2. Calculate user's rank in the league
  const { count: higherXPCount } = await supabase
    .from("user_global_progress")
    .select("*", { count: "exact", head: true })
    .eq("league", globalProgress.league)
    .gt("global_xp", globalProgress.global_xp);

  const rank = (higherXPCount || 0) + 1;

  // 3. Fetch user name from users table (authoritative source)
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // 4. Fetch additional XP types for current user
  const [
    { data: allFields },
    { data: fieldProgress }, 
    { data: sideQuestProgress }
  ] = await Promise.all([
    supabase.from("fields").select("id, name, slug"),
    supabase.from("user_field_progress").select("field_id, field_xp").eq("user_id", user.id),
    supabase.from("user_quest_progress").select("quest_id").eq("user_id", user.id).eq("completed", true)
  ]);

  const questIds = Array.from(new Set((sideQuestProgress || []).map(p => p.quest_id)));
  const { data: questsData } = await supabase.from("quests").select("id, xp_reward").in("id", questIds);
  const questXPMap = new Map((questsData || []).map(q => [q.id, q.xp_reward]));

  const fieldSlugMap = new Map((allFields || []).map(f => [f.id, f.slug]));
  
  const getFieldXP = (slugMatch: string) => {
    return (fieldProgress || [])
      .filter(fp => {
        const slug = fieldSlugMap.get(fp.field_id || "");
        return slug?.toLowerCase().includes(slugMatch);
      })
      .reduce((sum, fp) => sum + (fp.field_xp || 0), 0);
  };

  const fitnessXP = getFieldXP("fitness");
  const habitXP = getFieldXP("habit");
  const productivityXP = getFieldXP("productivity");
  const sideQuestXP = (sideQuestProgress || []).reduce((sum, p) => sum + (questXPMap.get(p.quest_id || "") || 0), 0);

  return {
    ...globalProgress,
    rank,
    fullName: userData?.full_name || user.email,
    userId: user.id,
    fitnessXP,
    habitXP,
    productivityXP,
    sideQuestXP
  };
}

export async function getLeagueLeaderboard(league: string) {
  const supabase = await createClient();

  // 1. Fetch league users from user_global_progress
  const { data: progressData, error: progressError } = await supabase
    .from("user_global_progress")
    .select("user_id, global_xp, global_level")
    .eq("league", league)
    .order("global_xp", { ascending: false })
    .limit(100);

  if (progressError) {
    console.error("Error fetching leaderboard progress:", progressError);
    return [];
  }

  if (!progressData || progressData.length === 0) return [];

  // 2. Extract user_ids
  const userIds = progressData.map(p => p.user_id);

  // 3. Fetch matching users from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", userIds);

  if (userError) {
    console.error("Error fetching leaderboard users:", userError);
  }

  // 4. Fetch additional data separately (avoiding relationship issues)
  const [
    { data: allFields },
    { data: fieldProgressData },
    { data: sideQuestProgressData }
  ] = await Promise.all([
    supabase.from("fields").select("id, slug"),
    supabase.from("user_field_progress").select("user_id, field_id, field_xp").in("user_id", userIds),
    supabase.from("user_quest_progress").select("user_id, quest_id").eq("completed", true).in("user_id", userIds)
  ]);

  const allQuestIds = Array.from(new Set((sideQuestProgressData || []).map(p => p.quest_id)));
  const { data: leaderQuestsData } = await supabase.from("quests").select("id, xp_reward").in("id", allQuestIds);
  const leaderQuestXPMap = new Map((leaderQuestsData || []).map(q => [q.id, q.xp_reward]));

  const fieldSlugMap = new Map((allFields || []).map(f => [f.id, f.slug]));
  const userMap = new Map((userData || []).map(u => [u.id, u.full_name || "Anonymous"]));
  
  const getAggregatedXP = (uid: string, slugMatch: string) => {
    return (fieldProgressData || [])
      .filter(fp => fp.user_id === uid && fieldSlugMap.get(fp.field_id || "")?.toLowerCase().includes(slugMatch))
      .reduce((sum, fp) => sum + (fp.field_xp || 0), 0);
  };

  return progressData.map((entry, index) => {
    const sideQuestXP = (sideQuestProgressData || [])
      .filter(p => p.user_id === entry.user_id)
      .reduce((sum, p) => sum + (leaderQuestXPMap.get(p.quest_id || "") || 0), 0);

    return {
      rank: index + 1,
      userId: entry.user_id,
      fullName: userMap.get(entry.user_id) || "Anonymous",
      globalLevel: entry.global_level,
      globalXP: entry.global_xp,
      fitnessXP: getAggregatedXP(entry.user_id, "fitness"),
      habitXP: getAggregatedXP(entry.user_id, "habit"),
      productivityXP: getAggregatedXP(entry.user_id, "productivity"),
      sideQuestXP,
    };
  });
}
