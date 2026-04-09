import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { 
  Shield, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowLeft
} from 'lucide-react'

interface RegisterPageProps {
  onNavigate?: (page: string) => void
  onRegister?: (username: string, email: string, password: string) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onNavigate,
  onRegister,
  isLoading = false,
  error: externalError = null
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const error = externalError || localError

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (pwd.length >= 8) strength += 25
    if (pwd.length >= 12) strength += 15
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 20
    if (/[0-9]/.test(pwd)) strength += 20
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 20
    
    if (strength < 40) return { strength, label: 'WEAK', color: 'bg-destructive' }
    if (strength < 70) return { strength, label: 'MEDIUM', color: 'bg-yellow-500' }
    return { strength, label: 'STRONG', color: 'bg-primary' }
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    try {
      if (onRegister) {
        await onRegister(formData.username, formData.email, formData.password)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setLocalError(message)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Animated grid background */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Pixel stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Floating code rain effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute text-primary font-pixel text-xs animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            {Math.random() > 0.5 ? '01' : '10'}
          </div>
        ))}
      </div>

      {/* Back to home button */}
      <Button 
        onClick={() => onNavigate?.('landing')}
        className="absolute top-4 left-4 z-20"
        variant="ghost"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        BACK
      </Button>

      {/* Main Register Card */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-card/95 backdrop-blur-sm border-4 border-primary/40 p-8 md:p-12 relative overflow-hidden">
          {/* Decorative scan lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />
          
          {/* Decorative corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-secondary" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-secondary" />

          <div className="relative space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <Badge className="bg-primary/20 text-primary border-2 border-primary font-pixel text-xs px-4 py-2">
                {'>> SYSTEM ACCESS REQUEST'}
              </Badge>
              
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/20 border-2 border-primary rounded flex items-center justify-center">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
              </div>

              <h1 className="font-pixel text-2xl md:text-3xl text-primary">
                NEW AGENT
                <br />
                REGISTRATION
              </h1>
              
              <p className="text-foreground/70 text-sm md:text-base">
                {'Create your account to begin your cyber mission'}
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-5 pt-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="font-pixel text-xs text-foreground/90 flex items-center gap-2">
                  <User className="w-3 h-3" />
                  USERNAME
                </Label>
                <div className={`relative transition-all ${focusedField === 'username' ? 'animate-pulse-glow' : ''}`}>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className={`bg-background/50 border-2 ${
                      focusedField === 'username' ? 'border-primary' : 'border-primary/30'
                    } text-foreground font-sans h-12 px-4 focus:border-primary transition-colors`}
                    placeholder="Choose your username"
                    disabled={isLoading}
                  />
                  {formData.username && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-pixel text-xs text-foreground/90 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  EMAIL ADDRESS
                </Label>
                <div className={`relative transition-all ${focusedField === 'email' ? 'animate-pulse-glow' : ''}`}>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`bg-background/50 border-2 ${
                      focusedField === 'email' ? 'border-primary' : 'border-primary/30'
                    } text-foreground font-sans h-12 px-4 focus:border-primary transition-colors`}
                    placeholder="your.email@example.com"
                    disabled={isLoading}
                  />
                  {formData.email && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-pixel text-xs text-foreground/90 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  PASSWORD
                </Label>
                <div className={`relative transition-all ${focusedField === 'password' ? 'animate-pulse-glow' : ''}`}>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`bg-background/50 border-2 ${
                      focusedField === 'password' ? 'border-primary' : 'border-primary/30'
                    } text-foreground font-sans h-12 px-4 pr-12 focus:border-primary transition-colors`}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[10px] text-foreground/70">
                        {'>> SECURITY LEVEL:'}
                      </span>
                      <span className={`font-pixel text-[10px] ${
                        passwordStrength.label === 'WEAK' ? 'text-destructive' :
                        passwordStrength.label === 'MEDIUM' ? 'text-yellow-500' :
                        'text-primary'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-2 bg-background/50 border border-primary/30 rounded overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error State */}
              {error && (
                <Card className="bg-destructive/10 border-2 border-destructive/30 p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div className="flex-1">
                      <p className="font-pixel text-[10px] text-destructive">
                        {'>> ERROR'}
                      </p>
                      <p className="text-sm text-destructive/90 mt-1">{error}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Submit Button */}
              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-sm h-14 animate-pulse-glow"
                disabled={isLoading}
              >
                <Zap className="w-5 h-5 mr-2" />
                {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-foreground/60">
                  {'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => onNavigate?.('login')}
                    className="text-secondary hover:text-secondary/80 font-pixel text-xs transition-colors bg-transparent border-none p-0"
                  >
                    {'>> LOGIN'}
                  </button>
                </p>
              </div>
            </form>

            {/* Mascot/Character hint */}
            <div className="flex items-center justify-center gap-2 pt-4 text-foreground/50 text-xs">
              <div className="w-6 h-6 border-2 border-accent/50 rounded flex items-center justify-center">
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <span className="font-pixel text-[10px]">
                {'CYBER GUARDIAN AWAITS YOU'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default RegisterPage
