"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Zap } from "lucide-react";
import { createLearningQuest } from "@/app/learn/actions";
import { useRouter } from "next/navigation";

interface QuestCreationModalProps {
  pathId: string;
  fieldId: string;
}

export function QuestCreationModal({ pathId, fieldId }: QuestCreationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState("50");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createLearningQuest(pathId, fieldId, title, description, parseInt(xpReward));
      setOpen(false);
      setTitle("");
      setDescription("");
      setXpReward("50");
      router.refresh();
    } catch (error) {
      console.error("Failed to create quest:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-bold h-11 px-6 rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)]">
          <Plus className="mr-2 h-4 w-4" />
          Add Quest
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Add New Quest</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="q-title" className="text-sm font-bold uppercase tracking-widest text-white/40">Quest Title</Label>
            <Input
              id="q-title"
              placeholder="e.g., Complete 3 sets of pushups"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white focus:border-teal-500/50 transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="q-description" className="text-sm font-bold uppercase tracking-widest text-white/40">Description</Label>
            <Textarea
              id="q-description"
              placeholder="What exactly needs to be done?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white focus:border-teal-500/50 transition-colors min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xp" className="text-sm font-bold uppercase tracking-widest text-white/40">XP Reward</Label>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-400" />
              <Input
                id="xp"
                type="number"
                min="0"
                max="1000"
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-teal-500/50 transition-colors pl-10"
                required
              />
            </div>
            <p className="text-[10px] text-white/20 italic">Suggested: 20-100 XP depending on difficulty</p>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-bold h-12 text-lg hover:opacity-90 transition-all"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Quest"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
