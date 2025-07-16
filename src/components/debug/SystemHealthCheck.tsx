
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'checking';
  message: string;
}

export const SystemHealthCheck = () => {
  const { toast } = useToast();
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = async () => {
    setIsRunning(true);
    const healthChecks: HealthCheck[] = [
      { name: 'Database Connection', status: 'checking', message: 'Checking...' },
      { name: 'User Authentication', status: 'checking', message: 'Checking...' },
      { name: 'Profile System', status: 'checking', message: 'Checking...' },
      { name: 'Messaging System', status: 'checking', message: 'Checking...' },
      { name: 'Live Streams', status: 'checking', message: 'Checking...' },
      { name: 'Match System', status: 'checking', message: 'Checking...' },
      { name: 'Storage System', status: 'checking', message: 'Checking...' }
    ];

    setChecks([...healthChecks]);

    try {
      // Database Connection
      const { error: dbError } = await supabase.from('profiles').select('count', { count: 'exact' });
      healthChecks[0] = {
        name: 'Database Connection',
        status: dbError ? 'fail' : 'pass',
        message: dbError ? dbError.message : 'Connected successfully'
      };
      setChecks([...healthChecks]);

      // User Authentication
      const { data: session } = await supabase.auth.getSession();
      healthChecks[1] = {
        name: 'User Authentication',
        status: session.session ? 'pass' : 'fail',
        message: session.session ? 'User authenticated' : 'No active session'
      };
      setChecks([...healthChecks]);

      if (session.session) {
        // Profile System
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.session.user.id)
          .single();
        
        healthChecks[2] = {
          name: 'Profile System',
          status: profileError ? 'fail' : 'pass',
          message: profileError ? profileError.message : 'Profile loaded successfully'
        };
        setChecks([...healthChecks]);

        // Messaging System
        const { data: messages, error: messageError } = await supabase
          .from('messages_between_users')
          .select('count', { count: 'exact' })
          .limit(1);
        
        healthChecks[3] = {
          name: 'Messaging System',
          status: messageError ? 'fail' : 'pass',
          message: messageError ? messageError.message : 'Messaging system operational'
        };
        setChecks([...healthChecks]);

        // Live Streams
        const { data: streams, error: streamError } = await supabase
          .from('live_streams')
          .select('count', { count: 'exact' })
          .limit(1);
        
        healthChecks[4] = {
          name: 'Live Streams',
          status: streamError ? 'fail' : 'pass',
          message: streamError ? streamError.message : 'Live streams operational'
        };
        setChecks([...healthChecks]);

        // Match System
        const { data: matches, error: matchError } = await supabase
          .from('matches')
          .select('count', { count: 'exact' })
          .limit(1);
        
        healthChecks[5] = {
          name: 'Match System',
          status: matchError ? 'fail' : 'pass',
          message: matchError ? matchError.message : 'Match system operational'
        };
        setChecks([...healthChecks]);

        // Storage System
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
        
        healthChecks[6] = {
          name: 'Storage System',
          status: storageError ? 'fail' : 'pass',
          message: storageError ? storageError.message : 'Storage system operational'
        };
        setChecks([...healthChecks]);
      } else {
        // Set remaining checks to fail if no session
        for (let i = 2; i < healthChecks.length; i++) {
          healthChecks[i] = {
            name: healthChecks[i].name,
            status: 'fail',
            message: 'Requires authentication'
          };
        }
        setChecks([...healthChecks]);
      }
    } catch (error) {
      toast({
        title: "Health check failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <X className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      case 'checking':
        return <Badge className="bg-blue-100 text-blue-800">CHECKING</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">UNKNOWN</Badge>;
    }
  };

  const allPassed = checks.every(check => check.status === 'pass');
  const anyFailed = checks.some(check => check.status === 'fail');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Health Check</span>
          <Button
            onClick={runHealthChecks}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Check'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Click "Run Check" to test system health
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {checks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm text-gray-600">{check.message}</p>
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              ))}
            </div>
            
            {!isRunning && (
              <div className="mt-6 p-4 rounded-lg border">
                <div className="flex items-center space-x-2">
                  {allPassed ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {allPassed 
                      ? 'All systems operational' 
                      : anyFailed 
                        ? 'Some systems need attention' 
                        : 'System check in progress'
                    }
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
