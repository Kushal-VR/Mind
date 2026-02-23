import { getLeagueData, getLeagueLeaderboard } from "./actions";
import { redirect } from "next/navigation";
import { LeagueContent } from "./league-content";

export default async function LeaguePage() {
  const userData = await getLeagueData();
  
  if (!userData) {
    return redirect("/dashboard");
  }

  const leaderboard = await getLeagueLeaderboard(userData.league);

  // promotion/demotion zone thresholds (visual only)
  const totalUsers = leaderboard.length;
  const promotionThreshold = Math.ceil(totalUsers * 0.2); // Top 20%
  const demotionThreshold = Math.floor(totalUsers * 0.8); // Bottom 20%

  // League hierarchy
  const hierarchy = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const currentIndex = hierarchy.findIndex(l => l.toLowerCase() === userData.league.toLowerCase());
  const nextLeague = currentIndex < hierarchy.length - 1 ? hierarchy[currentIndex + 1] : null;
  const prevLeague = currentIndex > 0 ? hierarchy[currentIndex - 1] : null;

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8">
      <LeagueContent 
        userData={userData}
        leaderboard={leaderboard}
        promotionThreshold={promotionThreshold}
        demotionThreshold={demotionThreshold}
        nextLeague={nextLeague}
        prevLeague={prevLeague}
      />
    </div>
  );
}
