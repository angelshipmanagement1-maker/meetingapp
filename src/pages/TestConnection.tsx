import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { socketService } from '@/services/socketService';
import { webrtcService } from '@/services/webrtcService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function TestConnection() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Backend API', status: 'pending', message: 'Not tested' },
    { name: 'Socket Connection', status: 'pending', message: 'Not tested' },
    { name: 'Media Access', status: 'pending', message: 'Not tested' },
    { name: 'Create Meeting', status: 'pending', message: 'Not tested' },
  ]);
  const [loading, setLoading] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, details } : test
    ));
  };

  const testBackendConnection = useCallback(async () => {
    updateTest('Backend API', 'pending', 'Testing...');
    try {
      const health = await apiService.healthCheck();
      updateTest('Backend API', 'success', 'Connected successfully', JSON.stringify(health, null, 2));
    } catch (error) {
      updateTest('Backend API', 'error', `Failed: ${error.message}`, error.stack);
    }
  }, []);

  const testSocketConnection = async () => {
    updateTest('Socket Connection', 'pending', 'Testing...');
    try {
      await socketService.connect();
      updateTest('Socket Connection', 'success', 'Connected successfully', `Socket ID: ${socketService.socketInstance?.id}`);
    } catch (error) {
      updateTest('Socket Connection', 'error', `Failed: ${error.message}`, error.stack);
    }
  };

  const testMediaAccess = async () => {
    updateTest('Media Access', 'pending', 'Testing...');
    try {
      const stream = await webrtcService.initializeMedia({ video: true, audio: true });
      const videoTracks = stream.getVideoTracks().length;
      const audioTracks = stream.getAudioTracks().length;
      updateTest('Media Access', 'success', `Access granted`, `Video tracks: ${videoTracks}, Audio tracks: ${audioTracks}`);
      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      // Try audio only
      try {
        const stream = await webrtcService.initializeMedia({ video: false, audio: true });
        const audioTracks = stream.getAudioTracks().length;
        updateTest('Media Access', 'warning', 'Audio only', `Audio tracks: ${audioTracks}, Video access denied`);
        stream.getTracks().forEach(track => track.stop());
      } catch {
        updateTest('Media Access', 'error', `Failed: ${error.message}`, error.stack);
      }
    }
  };

  const testCreateMeeting = async () => {
    updateTest('Create Meeting', 'pending', 'Testing...');
    try {
      const meeting = await apiService.createMeeting({
        hostName: 'Test Host'
      });
      updateTest('Create Meeting', 'success', `Meeting created: ${meeting.meetingId}`, JSON.stringify(meeting, null, 2));
    } catch (error) {
      updateTest('Create Meeting', 'error', `Failed: ${error.message}`, error.stack);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    await testBackendConnection();
    await testSocketConnection();
    await testMediaAccess();
    await testCreateMeeting();
    setLoading(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Loader2 className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    } as const;
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  useEffect(() => {
    // Auto-run basic tests on component mount
    testBackendConnection();
  }, [testBackendConnection]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Connection Diagnostics
            <Button onClick={runAllTests} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run All Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Results */}
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <h3 className="font-medium">{test.name}</h3>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                {test.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Show details</summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-32">{test.details}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {/* Individual Test Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={testBackendConnection} disabled={loading} variant="outline" size="sm">
              Test API
            </Button>
            <Button onClick={testSocketConnection} disabled={loading} variant="outline" size="sm">
              Test Socket
            </Button>
            <Button onClick={testMediaAccess} disabled={loading} variant="outline" size="sm">
              Test Media
            </Button>
            <Button onClick={testCreateMeeting} disabled={loading} variant="outline" size="sm">
              Test Meeting
            </Button>
          </div>
          
          {/* Environment Info */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Environment Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Frontend URL:</strong> {window.location.origin}</p>
                <p><strong>Backend URL:</strong> {import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}</p>
                <p><strong>User Agent:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
              </div>
              <div>
                <p><strong>Protocol:</strong> {window.location.protocol}</p>
                <p><strong>WebRTC Support:</strong> {navigator.mediaDevices ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Socket.IO:</strong> {socketService.connected ? '✅ Connected' : '❌ Disconnected'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}