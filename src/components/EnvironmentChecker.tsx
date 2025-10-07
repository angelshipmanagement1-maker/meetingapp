import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function EnvironmentChecker() {
  const [checks, setChecks] = useState({
    serverUrl: '',
    protocol: '',
    corsIssue: false,
    recommendation: ''
  });

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    const currentProtocol = window.location.protocol;
    const serverProtocol = serverUrl.startsWith('https') ? 'https:' : 'http:';
    
    const corsIssue = currentProtocol !== serverProtocol;
    
    let recommendation = '';
    if (corsIssue) {
      if (currentProtocol === 'http:' && serverProtocol === 'https:') {
        recommendation = 'Mixed content issue: Frontend is HTTP but backend is HTTPS. Use LOCAL-START.bat for local development.';
      } else {
        recommendation = 'Protocol mismatch detected. Ensure both frontend and backend use the same protocol.';
      }
    } else {
      recommendation = 'Environment looks good!';
    }

    setChecks({
      serverUrl,
      protocol: `Frontend: ${currentProtocol}, Backend: ${serverProtocol}`,
      corsIssue,
      recommendation
    });
  }, []);

  const handleFixEnvironment = () => {
    const newEnv = `VITE_SERVER_URL=http://localhost:3001\nVITE_APP_NAME=MeetTime`;
    navigator.clipboard.writeText(newEnv);
    alert('Environment configuration copied to clipboard! Paste this into your .env file and restart the servers.');
  };

  if (!checks.corsIssue) return null;

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="space-y-2">
          <p><strong>Environment Issue Detected:</strong></p>
          <p className="text-sm">Server URL: {checks.serverUrl}</p>
          <p className="text-sm">Protocols: {checks.protocol}</p>
          <p className="text-sm font-medium">{checks.recommendation}</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={handleFixEnvironment}>
              Copy Fix to Clipboard
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.href = '/test'}>
              Run Diagnostics
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}