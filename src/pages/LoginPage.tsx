import { FormEvent, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, LockKeyhole, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export const LoginPage = () => {
  const { 
    stage, 
    loading, 
    error, 
    requestOtp, 
    verifyOtpCode, 
    loginWithPassword,
    requestPasswordReset,
    resetPassword,
    setStage,
    username, 
    otpExpiresAt, 
    clearError, 
    logout 
  } = useAuth();
  
  const { theme } = useTheme();
  const [formUsername, setFormUsername] = useState(username);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');

  const isDark = theme === 'dark';

  const subtitle = useMemo(() => {
    if (stage === 'otp') return 'Enter the verification code we emailed to complete sign-in.';
    if (stage === 'reset_password') return 'Enter the OTP sent to your email and your new password.';
    return 'Enter an authorized email to sign in to your account.';
  }, [stage]);

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault();
    await requestOtp(formUsername.trim());
  };

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await verifyOtpCode(otp.trim());
  };

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault();
    await loginWithPassword(formUsername.trim(), password);
  };

  const handleForgotPassword = async () => {
    if (!formUsername.trim()) {
      alert("Please enter your email first");
      return;
    }
    await requestPasswordReset(formUsername.trim());
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    await resetPassword(formUsername.trim(), otp.trim(), newPassword);
  };

  if (stage === 'authenticated') {
    return <Navigate to="/arbitrage" replace />;
  }

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center px-6 py-12 transition-colors',
        'bg-gradient-to-br',
        isDark
          ? 'from-slate-950 via-slate-900 to-slate-800 text-slate-50'
          : 'from-slate-50 via-white to-slate-100 text-slate-900'
      )}
    >
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[1.05fr_1fr] items-center">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className={cn(
              'w-fit px-3 py-1 border',
              isDark
                ? 'bg-white/10 text-white border-white/30'
                : 'bg-primary/10 text-primary border-primary/30'
            )}
          >
            Secure Access
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">Market Dashboard</h1>
            <p className="text-muted-foreground max-w-xl">{subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            {[
              { title: 'JWT Protected', icon: <ShieldCheck className="h-5 w-5 text-primary" />, desc: 'Bearer tokens for every API call.' },
              { title: 'Dual Auth', icon: <KeyRound className="h-5 w-5 text-primary" />, desc: 'Login with secure OTP or your account password.' },
              { title: 'Session aware', icon: <LockKeyhole className="h-5 w-5 text-primary" />, desc: 'Auto-expiry and instant revocation on 401.' },
              { title: 'Inbox ready', icon: <Mail className="h-5 w-5 text-primary" />, desc: 'Use your authorized mailbox to receive codes.' },
            ].map((item) => (
              <div
                key={item.title}
                className={cn(
                  'rounded-xl border p-4 backdrop-blur transition-colors',
                  isDark
                    ? 'border-white/15 bg-white/5'
                    : 'border-slate-200 bg-white/80 shadow-sm'
                )}
              >
                <div className="flex items-center gap-3 text-foreground">
                  {item.icon}
                  <p className="font-semibold">{item.title}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-2xl border border-border/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {stage !== 'login' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 -ml-2" 
                  onClick={() => {
                    clearError();
                    setStage('login');
                  }}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-2xl">
                {stage === 'otp' ? 'Verify OTP' : stage === 'reset_password' ? 'Reset Password' : 'Sign in'}
              </CardTitle>
            </div>
            <CardDescription>
              {stage === 'otp'
                ? 'We sent a 6-digit code to your email. Enter it to continue.'
                : stage === 'reset_password'
                ? 'Check your email for the reset code and enter your new password below.'
                : 'Choose your preferred login method to access your dashboard.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error === "Request failed with status code 403" ? "Email not registered" : error}
              </div>
            )}

            {stage === 'login' ? (
              <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="otp">OTP Login</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>

                <TabsContent value="otp" className="space-y-4">
                  <form className="space-y-4" onSubmit={handleRequestOtp}>
                    <div className="space-y-2">
                      <Label htmlFor="email-otp">Authorized Email</Label>
                      <Input
                        id="email-otp"
                        type="email"
                        placeholder="you@example.com"
                        value={formUsername}
                        onChange={(e) => {
                          clearError();
                          setFormUsername(e.target.value);
                        }}
                        required
                        disabled={loading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Requesting OTP...' : 'Send OTP'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="password" className="space-y-4">
                  <form className="space-y-4" onSubmit={handlePasswordLogin}>
                    <div className="space-y-2">
                      <Label htmlFor="email-pass">Authorized Email</Label>
                      <Input
                        id="email-pass"
                        type="email"
                        placeholder="you@example.com"
                        value={formUsername}
                        onChange={(e) => {
                          clearError();
                          setFormUsername(e.target.value);
                        }}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="px-0 h-auto text-xs"
                          onClick={handleForgotPassword}
                        >
                          Forgot Password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : stage === 'otp' ? (
              <form className="space-y-4" onSubmit={handleOtpSubmit}>
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Input value={username} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit OTP</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => {
                      clearError();
                      setOtp(e.target.value);
                    }}
                    required
                    disabled={loading}
                  />
                  {otpExpiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expires at: {new Date(otpExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={logout}
                    disabled={loading}
                  >
                    Use a different account
                  </Button>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={username} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-otp">Verification OTP</Label>
                  <Input
                    id="reset-otp"
                    placeholder="Enter OTP from email"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password & Login'}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <p>Sessions are secured with JWT and expire automatically.</p>
            <p>Need help? Check your spam folder for the OTP email.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
