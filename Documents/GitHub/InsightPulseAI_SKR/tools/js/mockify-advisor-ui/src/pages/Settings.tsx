import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataSourceToggle } from '@/components/advisor/DataSourceToggle';
import { RoleToggle } from '@/components/advisor/RoleToggle';
import { DataFreshnessBadge } from '@/components/advisor/DataFreshnessBadge';
import { useRole } from '@/context/RoleContext';
import { useDataConnector } from '@/context/DataConnectorContext';
import { HomeIcon, SettingsIcon, DatabaseIcon, UsersIcon, WrenchIcon, ShieldIcon } from 'lucide-react';

const Settings = () => {
  const { role, setRole, isInternalView } = useRole();
  const { mode, setMode } = useDataConnector();

  const clearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1">
              <HomeIcon className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="general">
              <WrenchIcon className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="data">
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="access">
              <UsersIcon className="h-4 w-4 mr-2" />
              Access Control
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage application-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="local-storage">Application Storage</Label>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={clearLocalStorage}
                    >
                      Clear Local Storage
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will clear all saved preferences and reset the application to default settings.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <Switch id="dark-mode" disabled />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme (Coming soon)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Source Settings</CardTitle>
                <CardDescription>Configure data sources and simulation options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Data Source Mode</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the data source mode for the dashboard
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Card 
                      className={`cursor-pointer border-2 ${mode === 'simulated' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setMode('simulated')}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Simulated Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Use simulated data for demonstration purposes
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer border-2 ${mode === 'real' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setMode('real')}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Production Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Connect to real production data sources
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer border-2 ${mode === 'hybrid' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setMode('hybrid')}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Hybrid Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Mix of production and simulated data
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-t">
                  <div>
                    <h3 className="text-sm font-medium">Current Status</h3>
                    <p className="text-xs text-muted-foreground">Data source status and freshness</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DataSourceToggle />
                    <DataFreshnessBadge />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">User Role Simulation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Toggle between different user roles to see how content is filtered
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer border-2 ${role === 'client' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setRole('client')}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Client View</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          View dashboard as seen by clients, with scoped data and limited insights
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer border-2 ${role === 'internal' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setRole('internal')}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Internal View</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Full access to all data, metrics, and insights including sensitive information
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-t">
                  <div>
                    <h3 className="text-sm font-medium">Current Access Level</h3>
                    <p className="text-xs text-muted-foreground">Toggle between client and internal view</p>
                  </div>
                  <RoleToggle />
                </div>
                
                {isInternalView && (
                  <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                    <div className="flex items-start">
                      <ShieldIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-amber-800">Internal View Active</h3>
                        <p className="text-xs text-amber-700 mt-1">
                          You are currently viewing all data, including sensitive information and internal metrics. 
                          This content would not be visible to clients.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-between w-full items-center">
                  <p className="text-xs text-muted-foreground">
                    Role selection is saved in your browser's local storage
                  </p>
                  <Link to="/advisor">
                    <Button size="sm">
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>Scout Advisor Settings • Version 2.1.2</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;