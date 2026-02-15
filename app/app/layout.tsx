"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CheckCircle, 
  LayoutDashboard, 
  FolderKanban, 
  Clock, 
  Building2, 
  Users, 
  Settings, 
  Search, 
  Bell, 
  LogOut, 
  User,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [timer, setTimer] = useState("00:14:32");
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Simulate timer ticking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          const parts = prev.split(':').map(Number);
          let [h, m, s] = parts;
          s++;
          if (s >= 60) { s = 0; m++; }
          if (m >= 60) { m = 0; h++; }
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const navItems = [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/kanban", label: "Projects", icon: FolderKanban },
    { href: "/app/timesheet", label: "Timesheets", icon: Clock },
    { href: "#", label: "Clients", icon: Building2 },
    { href: "#", label: "Team", icon: Users },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-display">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight">TodoTrack</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg font-medium group transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="hidden lg:block ml-3">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Button variant="ghost" className="w-full justify-start px-3 py-6 mb-2 text-muted-foreground hover:text-foreground" asChild>
            <a href="#">
              <Settings className="w-6 h-6 mr-3" />
              <span className="hidden lg:inline">Settings</span>
            </a>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-2 py-6 hover:bg-muted">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu0z3XX2H8ac-26YEdokEH65P-46_BQcCwNVI52vQTarA60fPNoDaXcnm73dP5ixNrb0MWqdPSo3LD3m7u0w4NAFC-uwUwCgX0QnoS3L0UK92C28T7Lj5X_ydduQ96Fmd0rGOg7N7nhBpO8kh2-BaHOF1Bx96OrJy5VvcQt_90DK0L5kv84bo7FWfn7dMVVJIc97424KUDh9X2qcRR0LKxz9_1pOipwwLeaZtzBJkZtJZ6SBM-lpDj1khs1oGbi9f5HupKaWy8Jk4" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block overflow-hidden text-left">
                    <p className="text-sm font-semibold truncate">Alex Dev</p>
                    <p className="text-xs text-muted-foreground truncate">Senior Eng.</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 shrink-0 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-40 sticky top-0">
          <div className="flex-1 max-w-xl mr-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
              </div>
              <Input 
                className="pl-10 bg-muted/50 border-input focus:bg-background transition-colors" 
                placeholder="Search tasks, projects, or team members..." 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-muted/50 rounded-full px-4 py-1.5 border border-border">
              <div className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></div>
              <span className="font-mono font-medium text-lg tracking-wider">{timer}</span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 rounded-full hover:bg-background ml-1"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? (
                  <div className="h-2.5 w-2.5 bg-foreground rounded-[1px]" />
                ) : (
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-foreground border-b-[5px] border-b-transparent ml-0.5" />
                )}
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/20">
          {children}
        </div>
      </main>
    </div>
  );
}
