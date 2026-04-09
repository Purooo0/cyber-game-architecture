import React from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  Shield, 
  Zap, 
  Eye, 
  Award, 
  Medal, 
  Crown, 
  Sparkles,
  Target,
  Brain,
  Trophy,
  Star
} from 'lucide-react'

interface LandingPageProps {
  onNavigate?: (page: string, scenarioId?: string) => void
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }: LandingPageProps) => {
  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 cyber-grid opacity-30" />
        
        {/* Pixel stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
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

        {/* Header */}
        <header className="relative z-10 border-b-2 border-primary/30 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary pixel-border flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="font-pixel text-primary text-sm md:text-base tracking-wider">
                CYBERQUEST
              </h1>
            </div>
            <nav className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation('login')}
                className="text-foreground hover:text-primary font-sans text-sm"
              >
                Login
              </Button>
              <Button 
                onClick={() => handleNavigation('register')}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-pixel text-xs px-4 pixel-border-glow"
              >
                SIGN UP
              </Button>
            </nav>
          </div>
        </header>

        <main className="relative z-10">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="mb-6 bg-secondary/20 text-secondary border-2 border-secondary font-pixel text-xs px-4 py-2">
                {'>> NEW MISSION AVAILABLE'}
              </Badge>
              
              <h1 className="font-pixel text-3xl md:text-5xl lg:text-6xl text-primary mb-6 leading-tight pixel-text-shadow">
                CYBER
                <br />
                <span className="text-secondary">QUEST</span>
                <br />
                ACADEMY
              </h1>
              
              <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                {'Learn Cybersecurity Through Interactive Pixel Missions'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button 
                  size="lg" 
                  onClick={() => handleNavigation('login')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-sm px-8 py-6 animate-pulse-glow"
                >
                  <Zap className="mr-2 w-5 h-5" />
                  START GAME
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-pixel text-sm px-8 py-6 bg-transparent"
                >
                  <Eye className="mr-2 w-5 h-5" />
                  WATCH DEMO
                </Button>
              </div>

              {/* Video Demo Card */}
              <div className="relative max-w-3xl mx-auto">
                <Card className="bg-card border-4 border-primary/30 p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
                  
                  <div className="aspect-video bg-background/50 border-2 border-primary/20 rounded flex items-center justify-center relative overflow-hidden">
                    {/* Placeholder for video */}
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-10 h-10 text-primary" />
                      </div>
                      <p className="font-pixel text-xs text-foreground/70">
                        {'>> VIDEO DEMO HERE'}
                      </p>
                      <p className="text-sm text-foreground/50 max-w-md mx-auto">
                        {'Watch how students learn cybersecurity through exciting pixel missions'}
                      </p>
                    </div>
                    
                    {/* Decorative corner brackets */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary" />
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-pixel text-2xl md:text-4xl text-secondary mb-8 text-center">
                {'>> ABOUT THE GAME'}
              </h2>
              
              <Card className="bg-card border-2 border-secondary/30 p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative space-y-6">
                  <p className="text-foreground/90 leading-relaxed text-base md:text-lg">
                    {'Welcome to CyberQuest Academy, where you\'ll embark on an epic pixel adventure through the digital realm. As a young cyber defender, you\'ll face real-world security challenges disguised as thrilling game missions.'}
                  </p>
                  <p className="text-foreground/90 leading-relaxed text-base md:text-lg">
                    {'Learn to identify phishing attacks, protect sensitive data, and make critical decisions that impact your digital safety—all while leveling up your character and earning awesome badges.'}
                  </p>

                  <div className="pt-4">
                    <p className="font-pixel text-xs text-secondary mb-4 text-center">
                      {'>> UNLOCKABLE BADGES'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: Award, label: 'CYBER GUARDIAN', color: 'text-primary', bgColor: 'bg-primary/20', borderColor: 'border-primary' },
                        { icon: Medal, label: 'THREAT HUNTER', color: 'text-secondary', bgColor: 'bg-secondary/20', borderColor: 'border-secondary' },
                        { icon: Crown, label: 'DATA PROTECTOR', color: 'text-accent', bgColor: 'bg-accent/20', borderColor: 'border-accent' },
                        { icon: Sparkles, label: 'LEGEND', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', borderColor: 'border-yellow-400' },
                      ].map((badge, i) => (
                        <div 
                          key={i} 
                          className={`flex flex-col items-center gap-2 p-4 ${badge.bgColor} border-2 ${badge.borderColor} rounded hover:scale-105 transition-transform`}
                        >
                          <badge.icon className={`w-8 h-8 ${badge.color}`} />
                          <span className="font-pixel text-[10px] text-foreground/70 text-center leading-tight">
                            {badge.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Features Section */}
          <section className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-pixel text-2xl md:text-4xl text-primary mb-12 text-center">
                {'>> GAMEPLAY FEATURES'}
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Target,
                    title: 'Mission-Based',
                    description: 'Complete exciting missions that teach real cybersecurity concepts through interactive scenarios',
                    color: 'primary',
                  },
                  {
                    icon: Brain,
                    title: 'Choice-Driven',
                    description: 'Your decisions matter! Choose wisely as each choice leads to different outcomes and learning paths',
                    color: 'secondary',
                  },
                  {
                    icon: Trophy,
                    title: 'Level Up System',
                    description: 'Earn XP, unlock badges, and climb the leaderboard as you master cybersecurity skills',
                    color: 'accent',
                  },
                ].map((feature, i) => (
                  <Card 
                    key={i} 
                    className="bg-card border-2 border-primary/20 p-6 hover:border-primary/50 transition-all hover:scale-105 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative space-y-4">
                      <div className={`w-12 h-12 bg-${feature.color}/20 border-2 border-${feature.color} flex items-center justify-center mb-4`}>
                        <feature.icon className={`w-6 h-6 text-${feature.color}`} />
                      </div>
                      <h3 className="font-pixel text-sm text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-foreground/70 leading-relaxed text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Why Play Section */}
          <section className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-pixel text-2xl md:text-4xl text-secondary mb-12 text-center">
                {'>> WHY PLAY THIS GAME?'}
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Stay Safe Online',
                    description: 'Learn to recognize and avoid online threats like phishing, malware, and social engineering attacks',
                    icon: Shield,
                  },
                  {
                    title: 'Build Critical Thinking',
                    description: 'Develop problem-solving skills by analyzing threats and making informed security decisions',
                    icon: Brain,
                  },
                  {
                    title: 'Future-Ready Skills',
                    description: 'Gain valuable cybersecurity knowledge that prepares you for digital citizenship and future careers',
                    icon: Star,
                  },
                  {
                    title: 'Learn Through Play',
                    description: 'Educational content disguised as an engaging game—learn without even realizing it!',
                    icon: Zap,
                  },
                ].map((benefit, i) => (
                  <Card 
                    key={i}
                    className="bg-card border-2 border-secondary/30 p-6 hover:bg-card/80 transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-secondary/20 border-2 border-secondary flex items-center justify-center">
                          <benefit.icon className="w-6 h-6 text-secondary" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-pixel text-xs text-foreground">
                          {benefit.title}
                        </h3>
                        <p className="text-foreground/70 leading-relaxed text-sm">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <Card className="bg-gradient-to-b from-card to-background border-4 border-primary p-10 md:p-16 relative overflow-hidden animate-pulse-glow">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
                
                <div className="relative space-y-6">
                  <h2 className="font-pixel text-2xl md:text-4xl text-primary mb-4">
                    {'>> READY TO BEGIN?'}
                  </h2>
                  <p className="text-foreground/80 text-base md:text-lg leading-relaxed mb-8">
                    {'Join thousands of students already protecting the digital world. Your cyber adventure starts now!'}
                  </p>
                  
                  <div className="flex justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => handleNavigation('login')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-sm px-10 py-6"
                    >
                      <Zap className="mr-2 w-5 h-5" />
                      START CYBER MISSION
                    </Button>
                  </div>

                  <div className="pt-8 flex items-center justify-center gap-8 text-sm text-foreground/60">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="font-pixel text-[10px]">FREE TO PLAY</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-secondary" />
                      <span className="font-pixel text-[10px]">SAFE & SECURE</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t-2 border-primary/30 bg-background/80 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-pixel text-xs text-foreground/70">
                  CYBERQUEST ACADEMY © 2026
                </span>
              </div>
              <p className="text-foreground/50 text-sm">
                {'Made with '}
                <span className="text-accent">{'♥'}</span>
                {' for the next generation of cyber defenders'}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
