"use server";

import { createClient } from "@/supabase/server";

export async function getLearningFields() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch fields and user-specific progress (including 'unlocked' status)
  const { data: fields, error } = await supabase
    .from("fields")
    .select(`
      *,
      user_field_progress(unlocked, field_level, field_xp)
    `)
    .eq("user_field_progress.user_id", user.id)
    .order("unlock_global_level", { ascending: true });

  if (error) {
    console.error("Error fetching learning fields:", error);
    return [];
  }

  return fields.map(f => ({
    ...f,
    progress: (f.user_field_progress as any)?.[0] || { unlocked: false, field_level: 1, field_xp: 0 }
  }));
}

export async function getLearningPaths(fieldId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_learning_paths")
    .select("*")
    .eq("user_id", user.id)
    .eq("field_id", fieldId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching learning paths:", error);
    return [];
  }
  return data;
}

export async function getPathQuests(pathId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_learning_quests")
    .select("*")
    .eq("learning_path_id", pathId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching path quests:", error);
    return [];
  }
  return data;
}

export async function createLearningPath(fieldId: string, title: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("user_learning_paths")
    .insert({
      user_id: user.id,
      field_id: fieldId,
      title,
      description
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating path:", error);
    throw error;
  }
  return data;
}

export async function createLearningQuest(pathId: string, fieldId: string, title: string, description: string, xpReward: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("user_learning_quests")
    .insert({
      learning_path_id: pathId,
      user_id: user.id,
      field_id: fieldId,
      title,
      description,
      xp_reward: xpReward
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating quest:", error);
    throw error;
  }
  return data;
}

export async function completeLearningQuest(questId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch quest details
  const { data: quest, error: questError } = await supabase
    .from("user_learning_quests")
    .select("*")
    .eq("id", questId)
    .single();

  if (questError || !quest) {
    throw new Error("Quest not found");
  }

  if (quest.completed) {
    return { success: true, message: "Already completed" };
  }

  // 2. Perform atomic updates (using sequential await for now, as we don't have a combined RPC)
  // We'll use a Promise.all or sequential to update tables.
  
  try {
    const now = new Date().toISOString();
    const xpReward = quest.xp_reward;

    // Update Quest Completion
    const { error: updateError } = await supabase
      .from("user_learning_quests")
      .update({
        completed: true,
        completed_at: now
      })
      .eq("id", questId);

    if (updateError) throw updateError;

    // Update Field XP
    const { data: fieldProgress } = await supabase
      .from("user_field_progress")
      .select("field_xp")
      .eq("user_id", user.id)
      .eq("field_id", quest.field_id)
      .single();

    const newFieldXP = (fieldProgress?.field_xp || 0) + xpReward;
    await supabase
      .from("user_field_progress")
      .update({ field_xp: newFieldXP, updated_at: now })
      .eq("user_id", user.id)
      .eq("field_id", quest.field_id);

    // Update Global XP (70%)
    const { data: globalProgress } = await supabase
      .from("user_global_progress")
      .select("global_xp")
      .eq("user_id", user.id)
      .single();

    const globalXPReward = Math.round(xpReward * 0.7);
    const newGlobalXP = (globalProgress?.global_xp || 0) + globalXPReward;
    await supabase
      .from("user_global_progress")
      .update({ global_xp: newGlobalXP, updated_at: now })
      .eq("user_id", user.id);

    // Update Legacy User XP
    const { data: userData } = await supabase
      .from("users")
      .select("user_xp")
      .eq("id", user.id)
      .single();

    const newUserXP = (userData?.user_xp || 0) + xpReward;
    await supabase
      .from("users")
      .update({ user_xp: newUserXP, updated_at: now })
      .eq("id", user.id);

    return { success: true };
  } catch (error) {
    console.error("Error in completeLearningQuest:", error);
    throw error;
  }
}

export async function getFieldStats(fieldId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: fieldProgress }, { data: levels }] = await Promise.all([
    supabase
      .from("user_field_progress")
      .select("field_level, field_xp")
      .eq("user_id", user.id)
      .eq("field_id", fieldId)
      .single(),
    supabase
      .from("user_levels")
      .select("*")
      .order("level", { ascending: true })
  ]);

  const currentLevel = fieldProgress?.field_level || 1;
  const currentXP = fieldProgress?.field_xp || 0;

  let nextXP = 100;
  if (levels && levels.length > 0) {
    for (const level of levels) {
      if (level.level === currentLevel + 1) {
        nextXP = level.xp_required;
        break;
      }
    }
  }

  return {
    fieldId,
    currentLevel,
    currentXP,
    nextXP
  };
}

