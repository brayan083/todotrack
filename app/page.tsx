import React from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal, CheckCircle, Kanban, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Landing: React.FC = () => {
  return (
    <div className="bg-background text-foreground font-display antialiased selection:bg-primary selection:text-white">
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">T</div>
              <span className="font-bold text-xl tracking-tight text-foreground">TodoTrack</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Docs</a>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" className="hidden md:flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="shadow-lg shadow-primary/25">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            v2.0 is now live
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
            Time tracking built <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">for developers</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
            Seamlessly integrate project management with your commit history. No distractions, no context switching, just pure flow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button asChild size="lg" className="h-14 font-semibold text-lg shadow-xl shadow-primary/20 group">
              <Link href="/register">
                Start tracking for free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 font-semibold text-lg hover:bg-muted">
              <a href="#">
                <Terminal className="mr-2 h-5 w-5" />
                Install via CLI
              </a>
            </Button>
          </div>

          <div className="relative max-w-5xl mx-auto perspective-1000">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-20"></div>
            <div className="relative bg-background border border-border rounded-xl shadow-2xl overflow-hidden" style={{ boxShadow: '0 0 60px -15px rgba(var(--primary), 0.3)' }}>
               <div className="h-10 bg-muted border-b border-border flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto w-64 h-6 bg-background rounded text-[10px] flex items-center justify-center text-muted-foreground font-mono">app.todotrack.com/dashboard</div>
              </div>
              <div className="aspect-[16/9] w-full bg-card relative">
                 <img alt="Dashboard Mockup" className="w-full h-full object-cover opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoynHIblMIUfQoOQTPFijFRF9uBgbfKy44lIj6JcPVmPfbK37P-TDs4Gf1kA3UXCCtZCsG81_dMx0WYwaQqDcvLpfwjJpIrKaMs-mqqETMquhILRSFNoqfnJB3siZxTIcLMbPksKtGlBqBytxwi1EmDIn-IQ54DjoUuWLpUjObQxiGn_gk77P1fhD4HBjv0ixxFvggsKZdy84y0xN0eXoNvW4AHQqnMyGoxaGIY6QsojYniSyEpXz1ZWhI1jY1omBl38UHDiKgN9k" />
                 <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden" id="features">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything you need to ship faster</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Designed by engineers, for engineers. We've stripped away the fluff and kept the power.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Terminal className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Developer-First UX</h3>
              <p className="text-muted-foreground leading-relaxed">Full keyboard navigation and CLI integration. Manage your tasks without ever leaving your terminal or touching a mouse.</p>
            </div>
             <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Kanban className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Kanban Precision</h3>
              <p className="text-muted-foreground leading-relaxed">Visualize your workflow with customizable swimlanes. Drag, drop, and automate status updates via Git hooks.</p>
            </div>
             <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Activity className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Deep Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">Understand your coding patterns. Visualize peak productivity hours and optimize your team's velocity with real data.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-muted/50 border-t border-border pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">T</div>
                <span className="font-bold text-lg text-foreground">TodoTrack</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">The developer-centric time tracking tool that gets out of your way. Built for flow state.</p>
            </div>
             <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Features</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Pricing</a></li>
              </ul>
            </div>
            <div>
               <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Docs</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Community</a></li>
              </ul>
            </div>
             <div>
               <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">About</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Contact</a></li>
              </ul>
            </div>
          </div>
           <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2023 TodoTrack Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
