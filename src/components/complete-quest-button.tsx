"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { completeLearningQuest } from "@/app/learn/actions";
import { useRouter } from "next/navigation";

interface CompleteQuestButtonProps {
  questId: string;
  completed: boolean;
  xpReward: number;
}

export function CompleteQuestButton({ questId, completed, xpReward }: CompleteQuestButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    if (completed || loading) return;
    setLoading(true);
    try {
      await completeLearningQuest(questId);
      router.refresh();
    } catch (error) {
      console.error("Failed to complete quest:", error);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-green-400 font-bold bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm uppercase tracking-widest">Completed</span>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleComplete}
      disabled={loading}
      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold transition-all px-6 rounded-xl group"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Zap className="mr-2 h-4 w-4 text-yellow-400 group-hover:scale-110 transition-transform" />
          Finish (+{xpReward} XP)
        </>
      )}
    </Button>
  );
}
