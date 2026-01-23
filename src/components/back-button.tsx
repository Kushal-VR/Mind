"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallback?: string;
  label?: string;
  className?: string;
}

export function BackButton({ 
  fallback = "/dashboard", 
  label = "Back",
  className 
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Standard back behavior
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <Button 
      onClick={handleBack}
      variant="ghost" 
      className={cn("rounded-full bg-white/5 hover:bg-white/10 text-white px-4", className)}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </Button>
  );
}
