import { getPathQuests } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, Trophy, Zap, Target, CheckCircle2 } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { redirect } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { QuestCreationModal } from "@/components/quest-creation-modal";
import { CompleteQuestButton } from "@/components/complete-quest-button";
import { createClient } from "@/supabase/server";

interface PageProps {
  params: Promise<{
    fieldId: string;
    pathId: string;
  }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PathDetailsPage({ params }: PageProps) {
  const { fieldId, pathId } = await params;
  const supabase = await createClient();

  // Fetch Path Info
  const { data: path, error: pathError } = await supabase
    .from("user_learning_paths")
    .select("*")
    .eq("id", pathId)
    .single();

  if (pathError || !path) {
    return redirect(`/learn/${fieldId}`);
  }

  const quests = await getPathQuests(pathId);
  const completedQuests = quests.filter(q => q.completed).length;
  const totalQuests = quests.length;
  const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;
  const totalXP = quests.filter(q => q.completed).reduce((acc, q) => acc + q.xp_reward, 0);

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton fallback={`/learn/${fieldId}`} />
              <Badge variant="outline" className="text-white border-white/20 uppercase tracking-widest px-4 py-1 text-[10px] bg-white/5">
                Learning Path
              </Badge>
            </div>
            <QuestCreationModal pathId={pathId} fieldId={fieldId} />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">{path.title}</h1>
            <p className="text-white/40 text-lg max-w-2xl">{path.description || "No description provided for this path."}</p>
          </div>

          {/* Path Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900/40 border-white/10 p-6 backdrop-blur-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                <Target className="h-16 w-16 text-teal-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-2">Progress</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white italic">{progress}%</span>
                <span className="text-sm text-white/30 mb-1 font-bold">{completedQuests}/{totalQuests} Quests</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-white/5" />
            </Card>

            <Card className="bg-zinc-900/40 border-white/10 p-6 backdrop-blur-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                <Zap className="h-16 w-16 text-yellow-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-2">Total Path XP</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white italic">+{totalXP.toLocaleString()}</span>
                <span className="text-sm text-white/30 mb-1 font-bold">XP earned</span>
              </div>
            </Card>

            <Card className="bg-zinc-900/40 border-white/10 p-6 backdrop-blur-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                <Trophy className="h-16 w-16 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Status</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-white italic uppercase">
                  {progress === 100 && totalQuests > 0 ? "Mastered" : "In Progress"}
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* Quests List */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="h-px w-8 bg-teal-500/50" />
             <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Active Quests</h2>
          </div>

          {quests.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
              <p className="text-white/30 font-bold">No quests added to this path yet.</p>
              <div className="mt-4">
                <QuestCreationModal pathId={pathId} fieldId={fieldId} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {quests.map((quest) => (
                <Card key={quest.id} className={`bg-zinc-900/40 border-white/10 transition-all ${quest.completed ? "opacity-60 border-green-500/20" : "hover:border-white/20"}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex gap-4">
                        <div className={`mt-1 p-2 rounded-lg ${quest.completed ? "bg-green-500/20 text-green-400" : "bg-white/5 text-teal-400"}`}>
                          {quest.completed ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1">
                          <h3 className={`text-xl font-bold tracking-tight ${quest.completed ? "text-white/60 line-through" : "text-white"}`}>
                            {quest.title}
                          </h3>
                          <p className="text-white/40 text-sm">{quest.description || "No description."}</p>
                          <div className="flex items-center gap-3 pt-2">
                             <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-none text-[10px] font-black px-2">
                               +{quest.xp_reward} XP
                             </Badge>
                             {quest.completed && quest.completed_at && (
                               <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                                 Completed {new Date(quest.completed_at).toLocaleDateString()}
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                      <CompleteQuestButton questId={quest.id} completed={quest.completed} xpReward={quest.xp_reward} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
