"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createLearningPath } from "@/app/learn/actions";
import { useRouter } from "next/navigation";

interface PathCreationModalProps {
  fieldId: string;
}

export function PathCreationModal({ fieldId }: PathCreationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createLearningPath(fieldId, title, description);
      setOpen(false);
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (error) {
      console.error("Failed to create path:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-bold px-8 h-12 rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)]">
          <Plus className="mr-2 h-5 w-5" />
          Create New Path
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Create Learning Path</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-bold uppercase tracking-widest text-white/40">Path Title</Label>
            <Input
              id="title"
              placeholder="e.g., Morning Productivity, Advanced Leg Day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white focus:border-teal-500/50 transition-colors"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-white/40">Description</Label>
            <Textarea
              id="description"
              placeholder="What do you want to achieve with this path?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white focus:border-teal-500/50 transition-colors min-h-[100px]"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-bold h-12 text-lg hover:opacity-90 transition-all"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Path"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
