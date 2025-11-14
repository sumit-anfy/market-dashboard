import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CronJobStatus {
  lastRun: string | null;
  nextRun: string | null;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastDuration: number | null;
  errorMessage?: string;
}

interface CronStatusCardProps {
  jobName: string;
  displayName?: string;
}

export function CronStatusCard({ jobName, displayName }: CronStatusCardProps) {
  const [jobStatus, setJobStatus] = useState<CronJobStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/cron-status`);
        if (response.data.success && response.data.data[jobName]) {
          setJobStatus(response.data.data[jobName]);
        }
      } catch (error) {
        console.error('Failed to fetch cron status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [jobName]);

  if (loading || !jobStatus) {
    return null;
  }

  const getStatusIcon = () => {
    switch (jobStatus.status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      running: 'default',
      success: 'secondary',
      failed: 'destructive',
      idle: 'outline'
    };

    return (
      <Badge variant={variants[jobStatus.status] || 'outline'}>
        {jobStatus.status.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-sm font-medium">
              {displayName || jobName} Status
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Last Run:</span>
          <span className="font-medium">{formatDate(jobStatus.lastRun)}</span>
        </div>
        {/* <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Next Run:</span>
          <span className="font-medium">{formatDate(jobStatus.nextRun)}</span>
        </div> */}
        {jobStatus.lastDuration !== null && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium font-mono">
              {jobStatus.lastDuration < 1000
                ? `${jobStatus.lastDuration}ms`
                : `${(jobStatus.lastDuration / 1000).toFixed(2)}s`}
            </span>
          </div>
        )}
        {jobStatus.errorMessage && (
          <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-xs">
            <p className="font-semibold">Error:</p>
            <p className="truncate" title={jobStatus.errorMessage}>
              {jobStatus.errorMessage}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
