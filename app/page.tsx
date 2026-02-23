"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, CheckSquare, BarChart3, Zap, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores';

const Landing: React.FC = () => {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;
  return (
    <div className="bg-background text-foreground font-display antialiased selection:bg-primary selection:text-white">
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                <Clock className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">TimeTrack</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Características</a>
              <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Beneficios</a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Documentación</a>
            </div>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Button asChild className="shadow-lg shadow-primary/25">
                  <Link href="/app/dashboard">Ir al panel</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" className="hidden md:flex">
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                  <Button asChild className="shadow-lg shadow-primary/25">
                    <Link href="/register">Comenzar gratis</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Gestión inteligente de tiempo
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
            Controla tu tiempo,<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">maximiza tu productividad</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
            Registra tiempo en tus proyectos y tareas de forma simple y eficiente. Organiza tu trabajo, visualiza tu productividad y mejora tu desempeño.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button asChild size="lg" className="h-14 font-semibold text-lg shadow-xl shadow-primary/20 group">
              <Link href={isLoggedIn ? "/app/dashboard" : "/register"}>
                {isLoggedIn ? 'Ir al panel' : 'Comienza ahora - es gratis'}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 font-semibold text-lg hover:bg-muted">
              <Link href="/">
                <Clock className="mr-2 h-5 w-5" />
                Ver demo
              </Link>
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
                <div className="mx-auto w-64 h-6 bg-background rounded text-[10px] flex items-center justify-center text-muted-foreground font-mono">app.TimeTrack.com/dashboard</div>
              </div>
                <div className="aspect-[16/9] w-full bg-card relative">
                  <Image
                   alt="Dashboard Mockup"
                   src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=675&fit=crop"
                   fill
                   sizes="(min-width: 1024px) 900px, 100vw"
                   className="object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden" id="benefits">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">¿Por qué elegir TimeTrack?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Herramientas diseñadas para que registres tu tiempo sin distracciones y organices tu trabajo de manera efectiva.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Registro rápido de tiempo</h3>
              <p className="text-muted-foreground leading-relaxed">Comienza a registrar tiempo en cualquier proyecto con un solo clic. Sin complicaciones, solo pon el cronómetro en marcha.</p>
            </div>
             <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckSquare className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Organiza tus tareas</h3>
              <p className="text-muted-foreground leading-relaxed">Crea proyectos, tareas y subtareas. Visualiza tu flujo de trabajo con tableros Kanban intuitivos.</p>
            </div>
             <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Analítica detallada</h3>
              <p className="text-muted-foreground leading-relaxed">Obtén reportes precisos sobre cómo inviertes tu tiempo. Identifica patrones y mejora tu productividad.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 relative overflow-hidden bg-muted/30" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Características principales</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Todo lo que necesitas para gestionar tiempo y tareas de manera profesional.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="flex gap-6 p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Inicio rápido de tareas</h3>
                <p className="text-muted-foreground">Comienza a registrar tiempo en segundos. Sin configuraciones complicadas.</p>
              </div>
            </div>

            <div className="flex gap-6 p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Colaboración en equipo</h3>
                <p className="text-muted-foreground">Invita a tu equipo y trabaja juntos en proyectos compartidos.</p>
              </div>
            </div>

            <div className="flex gap-6 p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Seguimiento de metas</h3>
                <p className="text-muted-foreground">Define objetivos y ve tu progreso en tiempo real.</p>
              </div>
            </div>

            <div className="flex gap-6 p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Reportes inteligentes</h3>
                <p className="text-muted-foreground">Analiza tu productividad con gráficos y estadísticas detalladas.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20 rounded-2xl p-12 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">¿Listo para tomar control de tu tiempo?</h3>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Únete a miles de profesionales que utilizan TimeTrack para mejorar su productividad.</p>
            <Button asChild size="lg" className="shadow-lg shadow-primary/25">
              <Link href="/register">
                Empezar gratis ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-muted/50 border-t border-border pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg text-foreground">TimeTrack</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">La herramienta más simple para registrar tiempo, organizar tareas y mejorar tu productividad.</p>
            </div>
             <div>
              <h3 className="font-semibold text-foreground mb-4">Producto</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#features">Características</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#benefits">Beneficios</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="/login">Acceso</a></li>
              </ul>
            </div>
            <div>
               <h3 className="font-semibold text-foreground mb-4">Recursos</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Documentación</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Blog</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Soporte</a></li>
              </ul>
            </div>
             <div>
               <h3 className="font-semibold text-foreground mb-4">Empresa</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Acerca de</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Contacto</a></li>
                <li><a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Twitter</a></li>
              </ul>
            </div>
          </div>
           <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2024 TimeTrack. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacidad</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Términos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
