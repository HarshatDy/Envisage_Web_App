"use client"

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { User, Settings, LogOut, BarChart2, ChevronRight, Mail, Bell, Shield, Clock, BookOpen, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from 'next-auth/react';

interface UserStats {
  totalTimeSpent: number;
  articlesRead: number;
  categoryEngagement: {
    [key: string]: {
      timeSpent: number;
      articlesRead: number;
    }
  };
}

export function UserProfileDropdown() {
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/users/${session.user.id}/stats`);
          const data = await response.json();
          setUserStats(data);
        } catch (error) {
          console.error('Error fetching user stats:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserStats();
  }, [session?.user?.id]);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Get top 3 categories by engagement
  const topCategories = userStats ? Object.entries(userStats.categoryEngagement)
    .sort(([, a], [, b]) => (b.timeSpent + b.articlesRead) - (a.timeSpent + a.articlesRead))
    .slice(0, 3)
    .map(([category]) => category) : [];

  if (status !== "authenticated" || !session) {
    return null;
  }

  const profileImageUrl = session.user?.image || '/images/default-avatar.png';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
          {profileImageUrl ? (
            <Image 
              src={profileImageUrl} 
              alt={session.user?.name || "Profile"} 
              width={32} 
              height={32} 
              className="rounded-full h-8 w-8 object-cover"
              unoptimized={!profileImageUrl.startsWith('http')}
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden">
            {profileImageUrl ? (
              <Image 
                src={profileImageUrl} 
                alt={session.user?.name || "Profile"} 
                width={40} 
                height={40} 
                className="h-10 w-10 object-cover"
                unoptimized={!profileImageUrl.startsWith('http')}
              />
            ) : (
              <User className="h-6 w-6" />
            )}
          </div>
          <div className="text-sm">
            <p className="font-medium">{session.user?.name}</p>
            <p className="text-muted-foreground text-xs">{session.user?.email}</p>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* User Stats Section */}
        {!isLoading && userStats && (
          <div className="px-2 py-1.5">
            <div className="text-xs font-medium mb-2">Your Activity</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground">Articles Read</div>
                <div className="font-medium">{userStats.articlesRead}</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground">Time Spent</div>
                <div className="font-medium">{Math.round(userStats.totalTimeSpent / 60)}m</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Categories Section */}
        {!isLoading && topCategories.length > 0 && (
          <div className="px-2 py-1.5">
            <div className="text-xs font-medium mb-2">Top Categories</div>
            <div className="flex flex-wrap gap-1">
              {topCategories.map((category) => (
                <span 
                  key={category}
                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        <DropdownMenuSeparator />
        
        {/* Profile Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-56">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Account Details</div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{session.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Member since {new Date(session.user?.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {/* Settings Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-56">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Preferences</div>
                <div className="space-y-2">
                  <DropdownMenuItem className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Privacy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Categories</span>
                  </DropdownMenuItem>
                </div>
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {/* Stats Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <BarChart2 className="mr-2 h-4 w-4" />
            <span>Detailed Stats</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-56">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Reading Analytics</div>
                {!isLoading && userStats && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Articles</span>
                      <span className="font-medium">{userStats.articlesRead}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Time</span>
                      <span className="font-medium">{Math.round(userStats.totalTimeSpent / 60)}m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Avg. Time/Article</span>
                      <span className="font-medium">
                        {userStats.articlesRead > 0 
                          ? Math.round(userStats.totalTimeSpent / userStats.articlesRead / 60)
                          : 0}m
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 