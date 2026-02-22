import { getLearningPaths, getFieldStats } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Trophy } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { redirect } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { PathCreationModal } from "@/components/path-creation-modal";

interface PageProps {
  params: Promise<{
    fieldId: string;
  }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FieldPathPage({ params }: PageProps) {
  const { fieldId } = await params;
  
  const [paths, stats] = await Promise.all([
    getLearningPaths(fieldId),
    getFieldStats(fieldId)
  ]);

  if (!stats) {
    return redirect("/learn");
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton fallback="/learn" />
              <Badge variant="outline" className="text-white border-white/20 uppercase tracking-widest px-4 py-1 text-[10px] bg-white/5">
                Field Overview
              </Badge>
            </div>
            <PathCreationModal fieldId={fieldId} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            <div className="space-y-4 text-center lg:text-left">
              <h1 className="text-5xl font-extrabold tracking-tighter text-white">Your Workspace</h1>
              <p className="text-white/40 text-lg max-w-xl mx-auto lg:mx-0">
                Create and manage your custom learning paths. Track your progress and master your skills in your own way.
              </p>
            </div>

            <Card className="bg-zinc-900/40 border-white/10 p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="h-32 w-32 text-teal-400" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">Current Mastery</p>
                    <h2 className="text-4xl font-black text-white italic">LVL {stats.currentLevel}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Total Field XP</p>
                    <p className="text-2xl font-bold text-white tracking-tight">{stats.currentXP.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-white/40">Progress to Level {stats.currentLevel + 1}</span>
                    <span className="text-teal-400">{Math.round((stats.currentXP / stats.nextXP) * 100)}%</span>
                  </div>
                  <Progress value={(stats.currentXP / stats.nextXP) * 100} className="h-2 bg-white/5 border border-white/5" />
                  <p className="text-[10px] text-center text-white/20 font-bold italic">
                    {stats.nextXP - stats.currentXP} XP Remaining
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Paths Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/20">Learning Paths</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {paths.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
              <BookOpen className="h-12 w-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white/60 mb-2">No paths created yet</h3>
              <p className="text-white/30 text-sm mb-6">Start your journey by creating your first learning path today.</p>
              <PathCreationModal fieldId={fieldId} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paths.map((path) => (
                <Link key={path.id} href={`/learn/${fieldId}/${path.id}`}>
                  <Card className="h-full bg-zinc-900/40 border-white/10 hover:border-teal-500/30 transition-all group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[100px] -mr-16 -mt-16 group-hover:bg-teal-500/20 transition-colors" />
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-teal-500/30 group-hover:bg-teal-500/10 transition-colors">
                          <GraduationCap className="h-5 w-5 text-white group-hover:text-teal-400" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-white/10 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <CardTitle className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-1">{path.title}</CardTitle>
                      <CardDescription className="text-white/40 line-clamp-2 h-10">{path.description || "No description provided."}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                          Click to enter journey
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

