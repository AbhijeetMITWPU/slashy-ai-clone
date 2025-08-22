import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { ComposioAuth } from './ComposioAuth';
import { toast } from 'sonner';
import { useGuestAuth } from '@/hooks/useGuestAuth';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Mail, 
  MessageSquare, 
  FileText, 
  Github, 
  Slack,
  Settings,
  Plus,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  category: string;
}

interface IntegrationsPanelProps {
  selectedIntegrations: string[];
  onIntegrationsChange: (integrations: string[]) => void;
}

export const IntegrationsPanel = ({ selectedIntegrations, onIntegrationsChange }: IntegrationsPanelProps) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const { guestId } = useGuestAuth();

  // Mock integrations data - in real app this would come from Composio API
  useEffect(() => {
    const mockIntegrations: Integration[] = [
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Read and send emails, manage inbox',
        icon: <Mail className="w-5 h-5" />,
        enabled: false,
        status: 'disconnected',
        category: 'Communication'
      },
      {
        id: 'calendar',
        name: 'Google Calendar',
        description: 'Manage events and scheduling',
        icon: <Calendar className="w-5 h-5" />,
        enabled: false,
        status: 'disconnected',
        category: 'Productivity'
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Send messages and manage channels',
        icon: <Slack className="w-5 h-5" />,
        enabled: false,
        status: 'disconnected',
        category: 'Communication'
      },
      {
        id: 'github',
        name: 'GitHub',
        description: 'Manage repositories and issues',
        icon: <Github className="w-5 h-5" />,
        enabled: false,
        status: 'disconnected',
        category: 'Development'
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'Create and manage documents',
        icon: <FileText className="w-5 h-5" />,
        enabled: false,
        status: 'disconnected',
        category: 'Productivity'
      }
    ];

    // Set enabled state based on selected integrations
    const updatedIntegrations = mockIntegrations.map(integration => ({
      ...integration,
      enabled: selectedIntegrations.includes(integration.id)
    }));

    setIntegrations(updatedIntegrations);
    setLoading(false);
  }, [selectedIntegrations]);

  const toggleIntegration = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    if (integration.enabled) {
      // Remove from selected
      const newSelected = selectedIntegrations.filter(id => id !== integrationId);
      onIntegrationsChange(newSelected);
    } else {
      // Add to selected
      const newSelected = [...selectedIntegrations, integrationId];
      onIntegrationsChange(newSelected);
    }

    // Update local state
    setIntegrations(prev => prev.map(i => 
      i.id === integrationId 
        ? { ...i, enabled: !i.enabled, status: !i.enabled ? 'connected' : 'disconnected' as const }
        : i
    ));
  };

  const connectIntegration = (integrationId: string) => {
    // Get auth config ID from environment variables
    const authConfigId = getAuthConfigId(integrationId);
    if (!authConfigId) {
      console.error('No auth config ID found for integration:', integrationId);
      return;
    }

    // Initiate real OAuth flow with Composio
    console.log('Connecting integration:', integrationId, 'with config:', authConfigId);
    
    // Update status to connecting
    setIntegrations(prev => prev.map(i => 
      i.id === integrationId 
        ? { ...i, status: 'connected' as const }
        : i
    ));
  };

  const getAuthConfigId = (integrationId: string): string | null => {
    // Debug: log all environment variables
    console.log('All VITE environment variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    console.log('Raw import.meta.env:', import.meta.env);
    
    const configMap: Record<string, string> = {
      'gmail': import.meta.env.VITE_COMPOSIO_AUTH_GMAIL || '',
      'calendar': import.meta.env.VITE_COMPOSIO_AUTH_GOOGLECALENDAR || '',
      'github': import.meta.env.VITE_COMPOSIO_AUTH_GITHUB || '',
      'slack': import.meta.env.VITE_COMPOSIO_AUTH_SLACK || '',
      'notion': import.meta.env.VITE_COMPOSIO_AUTH_NOTION || '',
      'linear': import.meta.env.VITE_COMPOSIO_AUTH_LINEAR || '',
      'googlesheets': import.meta.env.VITE_COMPOSIO_AUTH_GoogleSheets || '',
      'googledrive': import.meta.env.VITE_COMPOSIO_AUTH_GoogleDrive || '',
      'googledocs': import.meta.env.VITE_COMPOSIO_AUTH_GoogleDocs || '',
    };
    
    console.log(`Looking for integration: ${integrationId}`);
    console.log('Config map:', configMap);
    console.log(`Value for ${integrationId}:`, configMap[integrationId]);
    
    const authConfigId = configMap[integrationId];
    if (!authConfigId) {
      console.error(`No auth config ID found for integration: ${integrationId}. Available configs:`, Object.keys(configMap));
      console.error('Config map values:', configMap);
      return null;
    }
    
    return authConfigId;
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const categories = Array.from(new Set(integrations.map(i => i.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Connect your tools to enhance AI capabilities
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Browse All
        </Button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto space-y-6">
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {category}
            </h4>
            
            <div className="grid gap-3">
              {integrations
                .filter(integration => integration.category === category)
                .map(integration => (
                  <Card key={integration.id} className="p-4 hover:bg-card/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 p-2 bg-muted/50 rounded-lg">
                          {integration.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium truncate">{integration.name}</h5>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs flex-shrink-0", getStatusColor(integration.status))}
                            >
                              {integration.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {integration.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {integration.status === 'disconnected' ? (
                          <ComposioAuth
                            integrationId={integration.id}
                            authConfigId={getAuthConfigId(integration.id) || ''}
                            userId={guestId || ''}
                            onAuthComplete={() => {
                              // Update integration status to connected
                              setIntegrations(prev => prev.map(i => 
                                i.id === integration.id 
                                  ? { ...i, status: 'connected' as const }
                                  : i
                              ));
                              toast.success(`${integration.name} connected successfully!`);
                            }}
                            onAuthError={(error) => {
                              toast.error(`Failed to connect ${integration.name}: ${error}`);
                            }}
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-xs whitespace-nowrap"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Connected
                          </Button>
                        )}
                        
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                          disabled={integration.status === 'disconnected'}
                        />
                      </div>
                    </div>
                  </Card>
                ))
              }
            </div>
          </div>
        ))}
      </div>

      {selectedIntegrations.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Active Integrations</h4>
          <div className="flex flex-wrap gap-2">
            {selectedIntegrations.map(id => {
              const integration = integrations.find(i => i.id === id);
              return integration ? (
                <Badge key={id} variant="secondary" className="flex items-center space-x-1">
                  {integration.icon}
                  <span>{integration.name}</span>
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};