"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { TrendingUp, TrendingDown, Trophy, BookOpen, Activity, Zap } from "lucide-react";
import RippleLoader from "./ui/rippleLoader";

interface WeeklyData {
  category: string;
  thisWeek: number;
  lastWeek: number;
}

export default function WeeklyProgressGraph() {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);

  // Initialize Supabase
  useEffect(() => {
    try {
      const client = createClient();
      setSupabase(client);
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
    }
  }, []);

  useEffect(() => {
    if (supabase) {
      fetchWeeklyData();
    }
  }, [supabase]);

  const getWeekBounds = (weeksAgo: number = 0) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate start of current week (Sunday)
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - currentDay);
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    
    // Calculate start of target week
    const startOfWeek = new Date(startOfCurrentWeek);
    startOfWeek.setDate(startOfCurrentWeek.getDate() - (weeksAgo * 7));
    
    // Calculate end of target week (Saturday 23:59:59)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { start: startOfWeek.toISOString(), end: endOfWeek.toISOString() };
  };

  const fetchWeeklyData = async () => {
    if (!supabase) return;

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get week bounds
      const thisWeek = getWeekBounds(0);
      const lastWeek = getWeekBounds(1);

      // --- FETCH THIS WEEK DATA ---
      const [
        { data: thisWeekSideCompletions },
        { data: thisWeekLearningCompletions },
        { count: thisWeekJournals }
      ] = await Promise.all([
        supabase
          .from("user_quest_progress")
          .select("quest_id")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("completed_at", thisWeek.start)
          .lte("completed_at", thisWeek.end),
        supabase
          .from("user_learning_quests")
          .select("xp_reward")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("completed_at", thisWeek.start)
          .lte("completed_at", thisWeek.end),
        supabase
          .from("journal_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", thisWeek.start)
          .lte("created_at", thisWeek.end)
      ]);

      // Calculate This Week XP
      let thisWeekSideXP = 0;
      if (thisWeekSideCompletions && thisWeekSideCompletions.length > 0) {
        const questIds = thisWeekSideCompletions.map((c: any) => c.quest_id);
        const { data: questsData } = await supabase
          .from("quests")
          .select("xp_reward")
          .in("id", questIds);
        thisWeekSideXP = (questsData || []).reduce((acc: number, q: any) => acc + (q.xp_reward || 0), 0);
      }
      const thisWeekLearningXP = (thisWeekLearningCompletions || []).reduce((acc: number, q: any) => acc + (q.xp_reward || 0), 0);
      const thisWeekTotalXP = thisWeekSideXP + thisWeekLearningXP;
      const thisWeekQuests = (thisWeekSideCompletions?.length || 0) + (thisWeekLearningCompletions?.length || 0);


      // --- FETCH LAST WEEK DATA ---
      const [
        { data: lastWeekSideCompletions },
        { data: lastWeekLearningCompletions },
        { count: lastWeekJournals }
      ] = await Promise.all([
        supabase
          .from("user_quest_progress")
          .select("quest_id")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("completed_at", lastWeek.start)
          .lte("completed_at", lastWeek.end),
        supabase
          .from("user_learning_quests")
          .select("xp_reward")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("completed_at", lastWeek.start)
          .lte("completed_at", lastWeek.end),
        supabase
          .from("journal_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", lastWeek.start)
          .lte("created_at", lastWeek.end)
      ]);

      // Calculate Last Week XP
      let lastWeekSideXP = 0;
      if (lastWeekSideCompletions && lastWeekSideCompletions.length > 0) {
        const questIds = lastWeekSideCompletions.map((c: any) => c.quest_id);
        const { data: questsData } = await supabase
          .from("quests")
          .select("xp_reward")
          .in("id", questIds);
        lastWeekSideXP = (questsData || []).reduce((acc: number, q: any) => acc + (q.xp_reward || 0), 0);
      }
      const lastWeekLearningXP = (lastWeekLearningCompletions || []).reduce((acc: number, q: any) => acc + (q.xp_reward || 0), 0);
      const lastWeekTotalXP = lastWeekSideXP + lastWeekLearningXP;
      const lastWeekQuests = (lastWeekSideCompletions?.length || 0) + (lastWeekLearningCompletions?.length || 0);

      setData([
        {
          category: "Quests",
          thisWeek: thisWeekQuests || 0,
          lastWeek: lastWeekQuests || 0,
        },
        {
          category: "Journals",
          thisWeek: thisWeekJournals || 0,
          lastWeek: lastWeekJournals || 0,
        },
        {
          category: "XP",
          thisWeek: thisWeekTotalXP || 0,
          lastWeek: lastWeekTotalXP || 0,
        },
      ]);
    } catch (error) {
      console.error("Error fetching weekly data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (thisWeek: number, lastWeek: number) => {
    if (lastWeek === 0) {
      return thisWeek > 0 ? { direction: "up", percentage: 100 } : { direction: "neutral", percentage: 0 };
    }
    
    const percentageChange = ((thisWeek - lastWeek) / lastWeek) * 100;
    
    if (percentageChange > 0) {
      return { direction: "up", percentage: Math.round(percentageChange) };
    } else if (percentageChange < 0) {
      return { direction: "down", percentage: Math.round(Math.abs(percentageChange)) };
    } else {
      return { direction: "neutral", percentage: 0 };
    }
  };

  const chartConfig = {
    thisWeek: {
      label: "This Week",
      color: "hsl(0, 0%, 100%)",
    },
    lastWeek: {
      label: "Last Week",
      color: "hsl(0, 0%, 45%)",
    },
  } satisfies ChartConfig;

  if (loading || !supabase) {
    return (
      <div className="flex items-center justify-center p-8 bg-black/50 border border-white/20 rounded-xl h-[400px]">
        <RippleLoader icon={<Activity />} size={200} duration={2} logoColor="white" />
      </div>
    );
  }

  const questsData = data.find(d => d.category === "Quests");
  const journalsData = data.find(d => d.category === "Journals");
  const xpData = data.find(d => d.category === "XP");

  const questTrend = questsData ? calculateTrend(questsData.thisWeek, questsData.lastWeek) : { direction: "neutral", percentage: 0 };
  const journalTrend = journalsData ? calculateTrend(journalsData.thisWeek, journalsData.lastWeek) : { direction: "neutral", percentage: 0 };
  const xpTrend = xpData ? calculateTrend(xpData.thisWeek, xpData.lastWeek) : { direction: "neutral", percentage: 0 };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quests Card */}
        <Card className="border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:shadow-lg hover:shadow-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/10">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg text-white">Quests</CardTitle>
              </div>
              {questTrend.direction !== "neutral" && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  questTrend.direction === "up" 
                    ? "bg-white/10 text-white" 
                    : "bg-white/5 text-white/70"
                }`}>
                  {questTrend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-semibold">{questTrend.percentage}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">{questsData?.thisWeek || 0}</span>
                <span className="text-sm text-white/60">this week</span>
              </div>
              <div className="text-xs sm:text-sm text-white/50">
                {questsData?.lastWeek || 0} last week
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journals Card */}
        <Card className="border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:shadow-lg hover:shadow-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/10">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg text-white">Journals</CardTitle>
              </div>
              {journalTrend.direction !== "neutral" && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  journalTrend.direction === "up" 
                    ? "bg-white/10 text-white" 
                    : "bg-white/5 text-white/70"
                }`}>
                  {journalTrend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-semibold">{journalTrend.percentage}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">{journalsData?.thisWeek || 0}</span>
                <span className="text-sm text-white/60">this week</span>
              </div>
              <div className="text-xs sm:text-sm text-white/50">
                {journalsData?.lastWeek || 0} last week
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP Card */}
        <Card className="border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:shadow-lg hover:shadow-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/10">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg text-white">XP Earned</CardTitle>
              </div>
              {xpTrend.direction !== "neutral" && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  xpTrend.direction === "up" 
                    ? "bg-white/10 text-white" 
                    : "bg-white/5 text-white/70"
                }`}>
                  {xpTrend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-semibold">{xpTrend.percentage}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">{xpData?.thisWeek || 0}</span>
                <span className="text-sm text-white/60">this week</span>
              </div>
              <div className="text-xs sm:text-sm text-white/50">
                {xpData?.lastWeek || 0} last week
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Card */}
      <Card className="border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:shadow-lg hover:shadow-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl text-white">Comparison Chart</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-white/60">
            Visual breakdown of this week vs last week
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ChartContainer config={chartConfig} className="h-[200px] sm:h-[280px] w-full">
            <BarChart 
              data={data} 
              margin={{ 
                top: 10, 
                right: 10, 
                bottom: 10, 
                left: -10 
              }}
              barSize={window.innerWidth < 640 ? 30 : 40}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
              <XAxis 
                dataKey="category" 
                stroke="rgba(255, 255, 255, 0.3)"
                tick={{ fill: "rgba(255, 255, 255, 0.7)", fontSize: window.innerWidth < 640 ? 11 : 13 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.3)"
                tick={{ fill: "rgba(255, 255, 255, 0.7)", fontSize: window.innerWidth < 640 ? 11 : 13 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                allowDecimals={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
              />
              <Legend 
                wrapperStyle={{ 
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: window.innerWidth < 640 ? "11px" : "13px",
                  paddingTop: "10px"
                }}
                iconType="circle"
                iconSize={8}
              />
              <Bar 
                dataKey="thisWeek" 
                fill="rgba(255, 255, 255, 0.9)" 
                radius={[6, 6, 0, 0]}
                name="This Week"
              />
              <Bar 
                dataKey="lastWeek" 
                fill="rgba(255, 255, 255, 0.35)" 
                radius={[6, 6, 0, 0]}
                name="Last Week"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
