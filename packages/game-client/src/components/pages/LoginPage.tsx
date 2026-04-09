import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { 
  Shield, 
  Lock, 
  Mail,
  Eye, 
  EyeOff, 
  Zap,
  CheckCircle2,
  Terminal,
  ArrowLeft
} from 'lucide-react'

interface LoginPageProps {
  onNavigate: (page: string) => void
  onLogin: (email: string, password: string) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onNavigate, 
  onLogin,
  isLoading = false,
  error: externalError = null
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const error = externalError || localError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    try {
      await onLogin(formData.email, formData.password)
    } catch (err) {
      setLocalError('Authentication failed. Please try again.')
      console.error('Login error:', err)
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
        onClick={() => onNavigate('landing')}
        variant="ghost" 
        className="absolute top-4 left-4 z-20 text-foreground hover:text-primary font-pixel text-xs bg-transparent"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        BACK
      </Button>

      {/* Main Login Card */}
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
              <Badge className="bg-secondary/20 text-secondary border-2 border-secondary font-pixel text-xs px-4 py-2">
                {'>> SECURE ACCESS'}
              </Badge>
              
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-secondary/20 border-2 border-secondary rounded flex items-center justify-center">
                  <Shield className="w-10 h-10 text-secondary" />
                </div>
              </div>

              <h1 className="font-pixel text-2xl md:text-3xl text-secondary">
                AGENT
                <br />
                LOGIN
              </h1>
              
              <p className="text-foreground/70 text-sm md:text-base">
                {'Authenticate to continue your cyber mission'}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
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
                    placeholder="Enter your password"
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
              </div>

              {/* Error State */}
              {error && (
                <Card className="bg-destructive/10 border-2 border-destructive/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-destructive" />
                    <div className="flex-1">
                      <p className="font-pixel text-[10px] text-destructive">
                        {'>> ERROR'}
                      </p>
                      <p className="text-sm text-destructive/90 mt-1">{error}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Loading State */}
              {isLoading && (
                <Card className="bg-secondary/10 border-2 border-secondary/30 p-4">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-secondary animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <p className="font-pixel text-[10px] text-secondary">
                        {'>> AUTHENTICATING...'}
                      </p>
                      <div className="h-1 bg-background/50 border border-secondary/30 rounded overflow-hidden">
                        <div className="h-full bg-secondary animate-pulse w-2/3" />
                      </div>
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
                {isLoading ? 'AUTHENTICATING...' : 'LOGIN'}
              </Button>

              {/* Create Account Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-foreground/60">
                  {'New agent? '}
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="text-secondary hover:text-secondary/80 font-pixel text-xs transition-colors bg-transparent border-none p-0"
                  >
                    {'>> CREATE NEW ACCOUNT'}
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
                {'WELCOME BACK, AGENT'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
