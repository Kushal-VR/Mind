import { getLearningFields } from "./actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default async function LearnPage() {
  const fields = await getLearningFields();

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-white">Learning Path</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Choose a field to master. Create your own learning paths and quests to help you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fields.map((field: any) => {
            return (
              <Card 
                key={field.id} 
                className="border border-white/10 bg-zinc-900/40 backdrop-blur-xl transition-all group overflow-hidden hover:border-white/20 hover:bg-zinc-900/60"
              >
                <CardHeader className="relative">
                  <div className="p-3 rounded-xl w-fit mb-4 transition-colors bg-gradient-to-br from-teal-500/20 to-indigo-500/20">
                    <BookOpen className="h-6 w-6 text-teal-400" />
                  </div>
                  <CardTitle className="text-2xl text-white font-bold">{field.name}</CardTitle>
                  <CardDescription className="text-white/50">{field.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold block">Field Mastery</span>
                      <span className="text-white font-bold">Level {field.progress?.field_level || 1}</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-right">
                      <ArrowRight className="h-5 w-5 text-teal-500/50 group-hover:text-teal-400 transition-colors ml-auto" />
                    </div>
                  </div>

                  <Button 
                    asChild 
                    className="w-full h-11 text-sm font-bold uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-teal-500 to-indigo-500 text-white hover:opacity-90 hover:scale-[1.02] shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                  >
                    <Link href={`/learn/${field.id}`} className="flex items-center justify-center gap-2">
                      Start Journey
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
