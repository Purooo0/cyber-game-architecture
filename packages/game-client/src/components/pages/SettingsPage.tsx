'use client'

import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface SettingsPageProps {
  onNavigate?: (page: string) => void
  onLogout?: () => void
  userName?: string
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  onNavigate, 
  onLogout,
  userName = 'CyberAgent007' 
}) => {
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  })
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    username: userName,
    email: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Get auth token from localStorage
  const token = localStorage.getItem('authToken')

  // Fetch user settings on mount
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!token) return
      
      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('[SettingsPage] Profile data:', data)
          
          // Update form dengan data dari backend
          if (data.profile) {
            console.log('[SettingsPage] Email from profile:', data.profile.email)
            setFormData(prev => ({ 
              ...prev, 
              username: data.profile.username || userName,
              email: data.profile.email || ''
            }))
            // Set initial avatar preview if available
            if (data.profile.avatar) {
              setAvatarPreview(data.profile.avatar)
            }
          }
        } else {
          console.error('[SettingsPage] Profile fetch failed:', response.status)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchUserSettings()
  }, [token, userName])

  const handleSave = async () => {
    setLoading(true)
    setSaveSuccess(false)
    setSaveError('')

    try {
      let hasChanges = false

      // Check if trying to change password
      const changingPassword = formData.newPassword || formData.confirmPassword
      if (changingPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (formData.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        hasChanges = true
      }

      // Check if trying to change avatar or username
      const changingProfile = selectedAvatar || (formData.username && formData.username.trim())
      if (changingProfile) {
        let avatarBase64 = undefined
        
        // Convert avatar file to base64 if selected
        if (selectedAvatar) {
          console.log('[handleSave] Converting avatar to base64...')
          avatarBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              console.log('[handleSave] Avatar converted to base64')
              resolve(reader.result as string)
            }
            reader.onerror = reject
            reader.readAsDataURL(selectedAvatar)
          })
        }

        console.log('[handleSave] Updating profile - Username:', formData.username, 'Avatar:', avatarBase64 ? 'yes' : 'no')

        const profileResponse = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            avatar: avatarBase64
          })
        })

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json()
          throw new Error(errorData.message || 'Failed to update profile')
        }
        hasChanges = true
      }

      // Update password if provided
      if (formData.newPassword) {
        console.log('[handleSave] Updating password...')
        const passwordResponse = await fetch('/api/user/password', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            newPassword: formData.newPassword
          })
        })

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json()
          throw new Error(errorData.message || 'Failed to update password')
        }
        hasChanges = true
      }

      if (!hasChanges) {
        throw new Error('No changes to save')
      }

      console.log('[handleSave] All changes saved successfully')
      setSaveSuccess(true)
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }))
      setSelectedAvatar(null)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveError(error instanceof Error ? error.message : 'Error saving changes')
      setTimeout(() => setSaveError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    onLogout?.()
    onNavigate?.('landing')
  }

  return (
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

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b-2 border-primary/30 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate?.('dashboard')}
                className="text-foreground hover:text-primary font-pixel text-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                BACK TO DASHBOARD
              </Button>
              
              <Badge className="bg-secondary/20 text-secondary border-2 border-secondary font-pixel text-xs px-4 py-2">
                {'>> SYSTEM CONFIG'}
              </Badge>
            </div>
            
            <div className="text-center">
              <h1 className="font-pixel text-3xl md:text-4xl text-primary mb-3">
                SYSTEM SETTINGS
              </h1>
              <p className="text-foreground/70 text-sm md:text-base">
                {'Configure your agent profile and system preferences'}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Success Message */}
            {saveSuccess && (
              <Card className="bg-primary/10 border-2 border-primary animate-pulse-glow">
                <div className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-pixel text-xs text-primary">
                      {'>> SETTINGS UPDATED SUCCESSFULLY'}
                    </p>
                    <p className="text-xs text-foreground/70 mt-1">
                      Your changes have been saved
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Error Message */}
            {saveError && (
              <Card className="bg-destructive/10 border-2 border-destructive">
                <div className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                  <div>
                    <p className="font-pixel text-xs text-destructive">
                      {'>> ERROR SAVING CHANGES'}
                    </p>
                    <p className="text-xs text-foreground/70 mt-1">
                      {saveError}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Profile Settings */}
            <Card className="bg-card/95 backdrop-blur-sm border-4 border-primary/40 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary" />

              <div className="relative space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/20 border-2 border-primary rounded flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="font-pixel text-xl text-foreground">
                    {'>> AGENT PROFILE'}
                  </h2>
                </div>

                {/* Avatar Preview */}
                <div className="flex items-center gap-6 pb-6 border-b border-primary/20">
                  <div className="w-24 h-24 bg-primary/10 border-4 border-primary rounded flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-14 h-14 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-foreground/70 mb-2">Profile Avatar</p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-pixel text-xs cursor-pointer">
                        CHANGE AVATAR
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="font-pixel text-xs text-foreground/90 flex items-center gap-2">
                      <User className="w-3 h-3" />
                      USERNAME
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="bg-background/50 border-2 border-primary/30 text-foreground h-12 font-sans focus:border-primary"
                      placeholder="Enter your username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-pixel text-xs text-foreground/90 flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      EMAIL
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-background/30 border-2 border-primary/20 text-foreground/50 h-12 font-sans cursor-not-allowed"
                      placeholder="Email address (read-only)"
                    />
                    <p className="text-xs text-foreground/60">Email cannot be changed</p>
                  </div>
                </div>

                {/* Change Password */}
                <div className="pt-4 space-y-4">
                  <p className="font-pixel text-xs text-secondary">
                    {'>> CHANGE PASSWORD'}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-xs text-foreground/70">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPassword.new ? 'text' : 'password'}
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="bg-background/50 border-2 border-primary/30 text-foreground h-11 pr-10 font-sans"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                        >
                          {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-xs text-foreground/70">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showPassword.confirm ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="bg-background/50 border-2 border-primary/30 text-foreground h-11 pr-10 font-sans"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
                        >
                          {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-pixel text-sm h-12 px-8 animate-pulse-glow"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'SAVING...' : 'SAVE CHANGES'}
                </Button>
              </div>
            </Card>

            {/* Logout Section */}
            <Card className="bg-destructive/10 border-4 border-destructive/40 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-destructive to-transparent" />
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive/20 border-2 border-destructive rounded flex items-center justify-center">
                    <LogOut className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="font-pixel text-sm text-destructive mb-1">
                      {'>> LOGOUT AGENT'}
                    </p>
                    <p className="text-xs text-foreground/60">
                      End your current session and return to login
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-pixel text-xs px-8 h-12 hover:animate-pulse-glow"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  LOGOUT NOW
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
