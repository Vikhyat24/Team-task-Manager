import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { setUser } from '../store/authSlice';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { User, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const Settings = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securityFieldErrors, setSecurityFieldErrors] = useState<Record<string, string>>({});

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileFieldErrors({});
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      const response = await api.put('/auth/update-profile', { name, email });
      dispatch(setUser(response.data.user));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      if (err.response?.data?.error?.details) {
        const errors: Record<string, string> = {};
        err.response.data.error.details.forEach((e: any) => {
          if (e.path && e.path[0]) errors[e.path[0]] = e.message;
        });
        setProfileFieldErrors(errors);
      } else {
        setProfileError(err.response?.data?.error?.message || 'Failed to update profile.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityFieldErrors({});
    setSecuritySuccess(false);

    try {
      passwordSchema.parse({ currentPassword, newPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((e: z.ZodIssue) => {
          if (e.path[0]) errors[e.path[0].toString()] = e.message;
        });
        setSecurityFieldErrors(errors);
        return;
      }
    }

    setSecurityLoading(true);

    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSecuritySuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setSecuritySuccess(false), 3000);
    } catch (err: any) {
      if (err.response?.data?.error?.details) {
        const errors: Record<string, string> = {};
        err.response.data.error.details.forEach((e: any) => {
          if (e.path && e.path[0]) errors[e.path[0]] = e.message;
        });
        setSecurityFieldErrors(errors);
      } else {
        setSecurityError(err.response?.data?.error?.message || 'Failed to change password.');
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-foreground bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Settings</h2>
        <p className="text-muted-foreground mt-2 tracking-tight text-lg">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'profile'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <User className="mr-3 h-5 w-5" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'security'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Lock className="mr-3 h-5 w-5" />
            Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="shadow-lg hover:shadow-indigo-500/20 transition-all border-white/10 bg-white/5 backdrop-blur-md relative z-10">
              <CardHeader>
                <CardTitle className="text-foreground tracking-tight">Profile Information</CardTitle>
                <CardDescription className="text-muted-foreground">Update your personal details and public profile.</CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileSubmit}>
                <CardContent className="space-y-4">
                  {profileError && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-100 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Profile updated successfully!
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className={profileFieldErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {profileFieldErrors.name && <p className="text-xs text-red-500 mt-1">{profileFieldErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className={profileFieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {profileFieldErrors.email && <p className="text-xs text-red-500 mt-1">{profileFieldErrors.email}</p>}
                  </div>
                </CardContent>
                <CardFooter className="bg-black/20 border-t border-white/10 px-6 py-4 mt-6">
                  <Button type="submit" disabled={profileLoading} className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 shadow-lg">
                    {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="shadow-lg hover:shadow-indigo-500/20 transition-all border-white/10 bg-white/5 backdrop-blur-md relative z-10">
              <CardHeader>
                <CardTitle className="text-foreground tracking-tight">Security</CardTitle>
                <CardDescription className="text-muted-foreground">Ensure your account is using a long, random password to stay secure.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSecuritySubmit}>
                <CardContent className="space-y-4">
                  {securityError && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
                      {securityError}
                    </div>
                  )}
                  {securitySuccess && (
                    <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-100 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Password changed successfully!
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={securityFieldErrors.currentPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {securityFieldErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{securityFieldErrors.currentPassword}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={securityFieldErrors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {securityFieldErrors.newPassword && <p className="text-xs text-red-500 mt-1">{securityFieldErrors.newPassword}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-black/20 border-t border-white/10 px-6 py-4 mt-6">
                  <Button type="submit" disabled={securityLoading} className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 shadow-lg">
                    {securityLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Update Password
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
