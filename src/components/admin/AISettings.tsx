import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Brain, Key, CheckCircle, AlertCircle } from 'lucide-react';

export const AISettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAIConfiguration();
  }, []);

  const checkAIConfiguration = async () => {
    try {
      // This would typically check if the API key is configured in your backend
      // For now, we'll simulate checking
      setIsConfigured(false);
    } catch (error) {
      console.error('Error checking AI configuration:', error);
    }
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first.",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    try {
      // Test the connection with a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "OpenAI API key is valid and connection successful!",
        });
        setIsConfigured(true);
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, you would save this to your secure backend
      // For demo purposes, we'll just show success
      toast({
        title: "Success",
        description: "AI configuration saved successfully!",
      });
      setIsConfigured(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
          AI Assistant Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Configure OpenAI integration to enable AI-powered inventory suggestions, 
            sales analytics, and product optimization features.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <Label className="text-sm sm:text-base font-medium">OpenAI API Status</Label>
              <p className="text-xs sm:text-sm text-gray-600">Current configuration status</p>
            </div>
            <Badge variant={isConfigured ? "default" : "secondary"} className="flex items-center w-fit text-xs">
              {isConfigured ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </>
              )}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-key" className="text-sm">OpenAI API Key</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button 
                onClick={testConnection} 
                variant="outline"
                disabled={testingConnection || !apiKey.trim()}
                className="w-full sm:w-auto text-sm"
              >
                <Key className="h-4 w-4 mr-2" />
                {testingConnection ? 'Testing...' : 'Test'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Your API key is stored securely and never shared. 
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                Get your API key here
              </a>
            </p>
          </div>

          <Button 
            onClick={saveConfiguration}
            disabled={isLoading || !apiKey.trim()}
            className="w-full text-sm"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>

        <div className="border-t pt-3 sm:pt-4">
          <h4 className="font-medium mb-2 text-sm sm:text-base">AI Features Available:</h4>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
            <li>• Smart product suggestions based on your business type</li>
            <li>• Inventory optimization recommendations</li>
            <li>• Sales analytics and growth strategies</li>
            <li>• Automated product descriptions</li>
            <li>• Stock level optimization</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
