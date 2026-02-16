"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code, User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/stores';

const Register: React.FC = () => {
  const router = useRouter();
  const { register, user, loading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user && !loading) {
      router.push('/app/dashboard');
    }
  }, [user, loading, router]);

  // Calcular fortaleza de contraseña
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setFormData({ ...formData, password: pwd });
    calculatePasswordStrength(pwd);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-destructive';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    return 'bg-primary';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validaciones
    if (!formData.name.trim()) {
      setLocalError('Por favor ingresa tu nombre completo');
      return;
    }
    if (!formData.email.trim()) {
      setLocalError('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (formData.password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    if (!agreeTerms) {
      setLocalError('Debes aceptar los términos y la política de privacidad');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(formData.email, formData.password, formData.name);
      // La redirección se hace automáticamente cuando user se actualiza
    } catch (err: any) {
      const errorMessage = err.message || 'Error al registrar. Por favor intenta de nuevo.';
      // Mapear errores comunes de Firebase
      if (errorMessage.includes('already in use')) {
        setLocalError('Este correo ya está registrado');
      } else if (errorMessage.includes('weak password')) {
        setLocalError('La contraseña es muy débil');
      } else {
        setLocalError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
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
            {(localError || error) && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{localError || error}</p>
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isSubmitting}
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Create Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Min. 8 characters" 
                    className="pl-9 pr-10"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 flex gap-1 h-1">
                    <div className={`flex-1 rounded-full ${passwordStrength >= 1 ? getPasswordStrengthColor() : 'bg-secondary'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 2 ? getPasswordStrengthColor() : 'bg-secondary'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 3 ? getPasswordStrengthColor() : 'bg-secondary'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 4 ? getPasswordStrengthColor() : 'bg-secondary'}`}></div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm your password" 
                    className="pl-9 pr-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formData.password && formData.confirmPassword && (
                  <div className="flex items-center gap-2 mt-2">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm text-primary">Las contraseñas coinciden</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">Las contraseñas no coinciden</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-3">
                 <Checkbox 
                   id="terms"
                   checked={agreeTerms}
                   onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                   disabled={isSubmitting}
                 />
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
                <Button 
                  type="submit" 
                  className="w-full shadow-lg shadow-primary/30"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
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
          </CardContent>

          <CardFooter className="justify-center border-t border-border">
            <p className="text-sm text-muted-foreground py-4">
              Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
