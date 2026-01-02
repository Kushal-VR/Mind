"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toggleFollow } from "@/app/u/actions";
import { cn } from "@/lib/utils";

interface UserListItemProps {
  user: {
    id: string;
    name: string;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    isFollowing?: boolean;
    isCurrentUser?: boolean;
  };
  onToggleFollow?: () => void;
}

export function UserListItem({ user, onToggleFollow }: UserListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      await toggleFollow(user.id);
      setIsFollowing(!isFollowing);
      if (onToggleFollow) onToggleFollow();
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
      <Link 
        href={`/u/${user.name}`}
        className="flex items-center gap-4 flex-1 min-w-0"
      >
        <Avatar className="h-12 w-12 border border-white/10 group-hover:border-white/30 transition-colors">
          <AvatarImage src={user.avatar_url || ""} alt={user.name} />
          <AvatarFallback className="bg-white/10">
            <UserCircle className="h-6 w-6 text-white/40" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h4 className="font-bold text-white group-hover:text-teal-400 transition-colors truncate">
              {user.full_name || user.name}
            </h4>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-black truncate">
              @{user.name}
            </p>
          </div>
          {user.bio && (
            <p className="text-xs text-white/60 line-clamp-1 mt-1 font-medium italic">
              {user.bio}
            </p>
          )}
        </div>
      </Link>

      {!user.isCurrentUser && (
        <Button
          onClick={handleToggleFollow}
          disabled={isLoading}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "ml-4 min-w-[100px] h-9 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all duration-300",
            isFollowing 
              ? "bg-white/10 hover:bg-red-500/20 hover:text-red-500 border border-white/10 hover:border-red-500/50" 
              : "bg-white text-black hover:bg-teal-400 hover:text-black"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isFollowing ? (
            isHovered ? "Unfollow" : "Following"
          ) : (
            "Follow"
          )}
        </Button>
      )}
    </div>
  );
}
