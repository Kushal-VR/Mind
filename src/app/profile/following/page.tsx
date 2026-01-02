import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { getFollowing } from "@/app/u/actions";
import { UserListItem } from "@/components/user-list-item";
import { Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";

export default async function FollowingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const following = await getFollowing(user.id);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton fallback="/profile" />
            <h1 className="text-3xl font-bold tracking-tight">Following</h1>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-white/10 text-xs font-black uppercase tracking-widest text-white/60">
            {following.length} Total
          </div>
        </div>

        <div className="space-y-4">
          {following.length > 0 ? (
            following.map((followingUser) => (
              <UserListItem key={followingUser.id} user={followingUser} />
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="p-4 rounded-full bg-white/5">
                <Users className="h-12 w-12 text-white/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white/60 uppercase tracking-tighter italic">You are not following anyone yet</h3>
                <p className="text-sm text-white/40 max-w-xs">Start following other masters to build your community.</p>
              </div>
              <Button asChild className="bg-white text-black hover:bg-teal-400 font-bold uppercase tracking-wider text-xs px-8 h-12 rounded-2xl transition-all">
                <Link href="/dashboard">Find Masters</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
