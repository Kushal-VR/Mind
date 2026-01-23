"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPublicProfile(username: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 1. Fetch user by username
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, full_name, bio, website, avatar_url")
    .eq("name", username)
    .single();

  if (userError || !user) return null;

  // 2. Fetch global progress
  const { data: globalProgress, error: globalError } = await supabase
    .from("user_global_progress")
    .select("global_xp, global_level, league")
    .eq("user_id", user.id)
    .single();

  // 3. Fetch ALL fields
  const { data: allFields } = await supabase
    .from("fields")
    .select("id, name");

  // 4. Fetch field progress (only unlocked fields)
  const { data: fieldProgress, error: fieldError } = await supabase
    .from("user_field_progress")
    .select("field_id, field_xp, field_level, unlocked")
    .eq("user_id", user.id)
    .eq("unlocked", true);

  if (fieldError) {
    console.error("Error fetching field progress:", fieldError);
  }

  // 5. Fetch follower/following counts
  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", user.id);

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id);

  // 6. Check if current user is following
  let isFollowing = false;
  if (currentUser) {
    const { data: follow } = await supabase
      .from("user_follows")
      .select("*")
      .eq("follower_id", currentUser.id)
      .eq("following_id", user.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  // Process field progress data to ensure complete dataset for radar chart
  const processedFields = (allFields || []).map(field => {
    const progress = (fieldProgress || []).find(p => p.field_id === field.id);
    return {
      id: field.id,
      name: field.name,
      level: progress ? progress.field_level : 0, // 0 for locked fields
      xp: progress ? progress.field_xp : 0,
      unlocked: progress ? progress.unlocked : false
    };
  });

  // Find max unlocked level for radar normalization
  const maxLevel = Math.max(...processedFields.map(f => f.level), 1);

  return {
    user,
    globalProgress,
    fieldProgress: processedFields,
    maxLevel,
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
    isFollowing,
    isCurrentUser: currentUser?.id === user.id
  };
}

export async function toggleFollow(followingId: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: "Not authenticated" };
  if (currentUser.id === followingId) return { error: "You cannot follow yourself" };

  // Check current status
  const { data: existingFollow } = await supabase
    .from("user_follows")
    .select("*")
    .eq("follower_id", currentUser.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existingFollow) {
    // Unfollow
    await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", followingId);
  } else {
    // Follow
    await supabase
      .from("user_follows")
      .insert({
        follower_id: currentUser.id,
        following_id: followingId
      });
  }

  revalidatePath(`/u`); // Revalidate all profile routes
  return { success: true };
}

export async function searchUsers(query: string) {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm || searchTerm.length < 2) return [];

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  let queryBuilder = supabase
    .from("users")
    .select("id, name, full_name, avatar_url")
    .ilike("name", `%${searchTerm}%`);

  if (currentUser) {
    queryBuilder = queryBuilder.neq("id", currentUser.id);
  }

  const { data, error } = await queryBuilder.limit(10);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  // If authenticated, check follow status for results
  if (currentUser) {
    const userIds = data.map((u: any) => u.id);
    const { data: followingStatus } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUser.id)
      .in("following_id", userIds);

    const followingSet = new Set(followingStatus?.map(s => s.following_id));
    return data.map((u: any) => ({
      ...u,
      isFollowing: followingSet.has(u.id)
    }));
  }

  return data.map((u: any) => ({ ...u, isFollowing: false }));
}

export async function getFollowers(userId: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      follower:users!user_follows_follower_id_fkey(id, name, full_name, avatar_url, bio)
    `)
    .eq("following_id", userId);

  if (error) {
    console.error("Error fetching followers:", error);
    return [];
  }

  const followers = data.map((item: any) => item.follower);

  // For each follower, check if the current user is following them
  if (currentUser) {
    const followerIds = followers.map((f: any) => f.id);
    const { data: followingStatus } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUser.id)
      .in("following_id", followerIds);

    const followingSet = new Set(followingStatus?.map(s => s.following_id));
    return followers.map((f: any) => ({
      ...f,
      isFollowing: followingSet.has(f.id),
      isCurrentUser: f.id === currentUser.id
    }));
  }

  return followers.map((f: any) => ({ ...f, isFollowing: false, isCurrentUser: false }));
}

export async function getFollowing(userId: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      following:users!user_follows_following_id_fkey(id, name, full_name, avatar_url, bio)
    `)
    .eq("follower_id", userId);

  if (error) {
    console.error("Error fetching following:", error);
    return [];
  }

  const following = data.map((item: any) => item.following);

  if (currentUser) {
    const followingIds = following.map((f: any) => f.id);
    const { data: followingStatus } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUser.id)
      .in("following_id", followingIds);

    const followingSet = new Set(followingStatus?.map(s => s.following_id));
    return following.map((f: any) => ({
      ...f,
      isFollowing: followingSet.has(f.id),
      isCurrentUser: f.id === currentUser.id
    }));
  }

  return following.map((f: any) => ({ ...f, isFollowing: true, isCurrentUser: false }));
}
