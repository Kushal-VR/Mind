import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { getFollowers } from "@/app/u/actions";
import { UserListItem } from "@/components/user-list-item";
import { Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";

export default async function FollowersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const followers = await getFollowers(user.id);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton fallback="/profile" />
            <h1 className="text-3xl font-bold tracking-tight">Followers</h1>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-white/10 text-xs font-black uppercase tracking-widest text-white/60">
            {followers.length} Total
          </div>
        </div>

        <div className="space-y-4">
          {followers.length > 0 ? (
            followers.map((follower) => (
              <UserListItem key={follower.id} user={follower} />
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="p-4 rounded-full bg-white/5">
                <Users className="h-12 w-12 text-white/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white/60 uppercase tracking-tighter italic">No followers yet</h3>
                <p className="text-sm text-white/40 max-w-xs">When people follow you, they'll appear here.</p>
              </div>
              <Button asChild className="bg-white text-black hover:bg-teal-400 font-bold uppercase tracking-wider text-xs px-8 h-12 rounded-2xl transition-all">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
