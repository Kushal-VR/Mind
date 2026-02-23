"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, ArrowUp, ArrowDown, UserCircle, Star } from "lucide-react";
import { LeagueCountdown } from "./league-countdown";

type XPType = "globalXP" | "fitnessXP" | "habitXP" | "productivityXP" | "sideQuestXP";

interface LeagueContentProps {
  userData: any;
  leaderboard: any[];
  promotionThreshold: number;
  demotionThreshold: number;
  nextLeague: string | null;
  prevLeague: string | null;
}

const XP_LABELS: Record<XPType, string> = {
  globalXP: "Global XP",
  fitnessXP: "Fitness XP",
  habitXP: "Habit XP",
  productivityXP: "Productivity XP",
  sideQuestXP: "Side Quest XP",
};

export function LeagueContent({
  userData,
  leaderboard,
  promotionThreshold,
  demotionThreshold,
  nextLeague,
  prevLeague,
}: LeagueContentProps) {
  const [xpType, setXpType] = useState<XPType>("globalXP");

  const getXPValue = (data: any, type: XPType) => {
    return data[type] || 0;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-4 text-center md:text-left">
          <Badge variant="outline" className="text-white border-white/20 uppercase tracking-widest px-4 py-1 text-[10px] bg-white/5">
            Competitive League
          </Badge>
          <h1 className="text-5xl font-bold tracking-tighter text-white uppercase italic">
            {userData.league} League
          </h1>
          <div className="flex items-center justify-center md:justify-start pt-2">
            <LeagueCountdown />
          </div>
        </div>

        <div className="w-full md:w-64 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">View Progress By</label>
          <Select value={xpType} onValueChange={(v) => setXpType(v as XPType)}>
            <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white font-bold h-12 rounded-xl">
              <SelectValue placeholder="Select XP Type" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              <SelectItem value="globalXP">Global XP</SelectItem>
              <SelectItem value="fitnessXP">Fitness XP</SelectItem>
              <SelectItem value="habitXP">Habit XP</SelectItem>
              <SelectItem value="productivityXP">Productivity XP</SelectItem>
              <SelectItem value="sideQuestXP">Side Quest XP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black/30 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Your Rank</CardDescription>
            <CardTitle className="text-4xl font-black text-white italic">#{userData.rank}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              {userData.rank <= promotionThreshold ? (
                <ArrowUp className="h-4 w-4 text-green-400" />
              ) : userData.rank > demotionThreshold ? (
                <ArrowDown className="h-4 w-4 text-red-400" />
              ) : null}
              <span className="font-bold">{userData.fullName}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
              {XP_LABELS[xpType]}
            </CardDescription>
            <CardTitle className="text-4xl font-black text-white italic">
              {xpType === "globalXP" ? `LVL ${userData.global_level}` : `${getXPValue(userData, xpType)} XP`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <Star className="h-3 w-3 fill-teal-500 text-teal-400" />
              <span>{getXPValue(userData, xpType).toLocaleString()} {XP_LABELS[xpType]}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Status</CardDescription>
            <CardTitle className="text-4xl font-black text-white italic uppercase">
              {userData.rank <= promotionThreshold ? "Promotion" : userData.rank > demotionThreshold ? "Demotion" : "Safe"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-white/60 text-xs font-medium">Rankings fixed by Global XP</span>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Section */}
      <Card className="bg-zinc-900/40 border-white/10 backdrop-blur-xl overflow-hidden rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            League Leaderboard
          </CardTitle>
          <CardDescription className="text-white/40">
            Competing against others in the {userData.league} League
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-2xl border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[80px] text-white/40 uppercase tracking-widest text-[10px] font-black">Rank</TableHead>
                  <TableHead className="text-white/40 uppercase tracking-widest text-[10px] font-black">User</TableHead>
                  <TableHead className="text-white/40 uppercase tracking-widest text-[10px] font-black text-center">LVL</TableHead>
                  <TableHead className="text-right text-white/40 uppercase tracking-widest text-[10px] font-black text-teal-400">
                    {XP_LABELS[xpType]}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((user) => {
                  const isPromotion = user.rank <= promotionThreshold;
                  const isDemotion = user.rank > demotionThreshold;
                  const isCurrentUser = user.userId === userData.userId;
                  
                  return (
                    <TableRow 
                      key={user.userId} 
                      className={`border-white/5 hover:bg-white/5 transition-colors ${isCurrentUser ? "bg-teal-500/10" : ""}`}
                    >
                      <TableCell className="font-black text-lg">
                        <div className="flex items-center gap-2">
                          {user.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                          {user.rank}
                          {isPromotion && user.rank !== 1 && <ArrowUp className="h-3 w-3 text-green-400 mt-0.5" />}
                          {isDemotion && <ArrowDown className="h-3 w-3 text-red-400 mt-0.5" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/10">
                            <UserCircle className="h-5 w-5 text-white/60" />
                          </div>
                          <span className={`font-bold ${isPromotion ? "text-white" : "text-white/70"}`}>{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10 font-bold">
                          {user.globalLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-teal-400">
                        {getXPValue(user, xpType).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend / Info Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex items-start gap-3">
          <ArrowUp className="h-5 w-5 text-green-400 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-bold text-white uppercase italic tracking-tighter">Promotion Zone</p>
            <p className="text-xs text-white/40 mt-1">
              {nextLeague 
                ? `Top players in this league will be promoted to ${nextLeague} League at the end of the week.`
                : "You are in the highest league! Top players maintain their elite status."}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
          <ArrowDown className="h-5 w-5 text-red-400 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-bold text-white uppercase italic tracking-tighter">Demotion Zone</p>
            <p className="text-xs text-white/40 mt-1">
              {prevLeague 
                ? `Players in the bottom tier will drop to ${prevLeague} League. Keep up the daily flow!`
                : "You are in the entry league. Bottom players will remain in Bronze."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
