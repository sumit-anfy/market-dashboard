import { FormEvent, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, LockKeyhole, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export const LoginPage = () => {
  const { stage, loading, error, requestOtp, verifyOtpCode, username, otpExpiresAt, clearError, logout } =
    useAuth();
  const { theme } = useTheme();
  const [formUsername, setFormUsername] = useState(username);
  const [otp, setOtp] = useState('');

  const isDark = theme === 'dark';

  const subtitle = useMemo(() => {
    if (stage === 'otp') return 'Enter the verification code we emailed to complete sign-in.';
    return 'Enter an authorized email to receive a one-time code.';
  }, [stage]);

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault();
    await requestOtp(formUsername.trim());
  };

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await verifyOtpCode(otp.trim());
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
              { title: 'Email-first', icon: <KeyRound className="h-5 w-5 text-primary" />, desc: 'OTP goes to the approved email you sign in with.' },
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
            <CardTitle className="text-2xl">{stage === 'otp' ? 'Verify OTP' : 'Sign in'}</CardTitle>
            <CardDescription>
              {stage === 'otp'
                ? 'We sent a 6-digit code to the authorized email you provided. Enter it to continue.'
                : 'Enter an authorized email to get a one-time code for access.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error === "Request failed with status code 403" ? "Email not registered" : error}
              </div>
            )}

            {stage === 'login' ? (
              <form className="space-y-4" onSubmit={handleRequestOtp}>
                <div className="space-y-2">
                  <Label htmlFor="username">Authorized Email</Label>
                  <Input
                    id="username"
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
            ) : (
              <form className="space-y-4" onSubmit={handleOtpSubmit}>
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Input
                    value={username}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit OTP</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    placeholder="123456"
                    min="100000"
                    max="999999"
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
