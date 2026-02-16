"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebarAdvanced } from "@/components/app-sidebar-advanced";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [timer, setTimer] = useState("00:14:32");
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Simulate timer ticking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && user) {
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
      return () => clearInterval(interval);
    }
  }, [isTimerRunning, user]);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarAdvanced />
      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6">
          <SidebarTrigger className="-ml-1" />
          
          <div className="flex-1 max-w-xl">
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
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/20 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
