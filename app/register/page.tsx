"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code, User, Mail, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const Register: React.FC = () => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/app/dashboard');
  };

  return (
    <div className="bg-background font-display antialiased min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center mb-8">
          <Link href="/" className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Code className="text-white h-6 w-6" />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">Start shipping with TodoTrack</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Project management built for developers.</p>
        </div>

        <Card className="shadow-2xl shadow-black/50 border border-border/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
          
          <CardContent className="p-8">
            <form action="#" className="space-y-6" onSubmit={handleSubmit}>
              <div className="bg-muted p-1 rounded-lg flex text-sm font-medium mb-6 border border-border">
                <Button variant="outline" className="flex-1 shadow-sm bg-background">Create Workspace</Button>
                <Button variant="ghost" className="flex-1 text-muted-foreground hover:text-foreground">Join a Team</Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="e.g. Linus Torvalds" 
                    className="pl-9"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    className="pl-9"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Create Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Min. 8 characters" 
                    className="pl-9 pr-10"
                    required 
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex gap-1 h-1">
                  <div className="flex-1 bg-primary/80 rounded-full"></div>
                  <div className="flex-1 bg-primary/40 rounded-full"></div>
                  <div className="flex-1 bg-secondary rounded-full"></div>
                  <div className="flex-1 bg-secondary rounded-full"></div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                 <Checkbox id="terms" />
                 <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none text-muted-foreground"
                  >
                     I agree to the <a className="text-primary hover:text-primary/80 underline decoration-primary/30" href="#">Terms</a> and <a className="text-primary hover:text-primary/80 underline decoration-primary/30" href="#">Privacy Policy</a>
                  </label>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full shadow-lg shadow-primary/30">
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                </div>
              </div>
            </div>
             {/* Social login buttons would go here similar to login page if needed, but keeping it simpler as per original file structure roughly */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
