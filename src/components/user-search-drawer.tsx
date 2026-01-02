"use client";

import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Users, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchUsers } from "@/app/u/actions";
import { UserListItem } from "./user-list-item";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface UserSearchDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserSearchDrawer({ open, onOpenChange }: UserSearchDrawerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function performSearch() {
      const searchTerm = debouncedQuery.trim();
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const users = await searchUsers(searchTerm);
        setResults(users);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery]);

  // Handle clear search
  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md bg-black border-l border-white/10 p-0 flex flex-col"
      >
        <SheetHeader className="p-6 border-b border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">
              Find People
            </SheetTitle>
          </div>
          <SheetDescription className="text-white/40 text-sm font-medium">
            Search for other masters to see their progress and follow their journey.
          </SheetDescription>
          
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 group-focus-within:bg-teal-500/10 transition-colors">
              <Search className={cn(
                "h-4 w-4 transition-colors",
                query ? "text-teal-400" : "text-white/20"
              )} />
            </div>
            <Input
              placeholder="Search by username or handle..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-teal-500/30 transition-all font-medium border-0 ring-1 ring-white/10"
              autoFocus
            />
            {query && (
              <button 
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="py-6 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-white/5 border-t-teal-500 animate-spin" />
                  <Search className="absolute inset-0 m-auto h-4 w-4 text-white/20" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 animate-pulse">
                  Searching Database
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid gap-3">
                {results.map((user) => (
                  <UserListItem 
                    key={user.id} 
                    user={user} 
                    onToggleFollow={() => {
                        // Optional: refresh if needed, but UserListItem handles its own optimistic UI
                    }}
                  />
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Users className="h-8 w-8 text-white/20" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white text-lg">No results found</p>
                  <p className="text-sm text-white/60">We couldn't find anyone matching "{query}"</p>
                </div>
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                <div className="relative">
                   <div className="absolute -inset-4 bg-teal-500/10 blur-2xl rounded-full animate-pulse" />
                   <Search className="h-16 w-16 text-white relative" />
                </div>
                <div className="space-y-1">
                   <p className="text-xs font-black uppercase tracking-[0.3em] italic">Search Pulse</p>
                   <p className="text-[10px] font-medium max-w-[180px] leading-relaxed">
                     Connect with others in the mindfulness collective
                   </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t border-white/10 bg-white/[0.02]">
           <p className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center">
             Mindfulness is better together
           </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
