import React from 'react';
import { Page } from '@/components/layout/Page';
import { PageHeader } from '@/components/layout/PageHeader';
import { PaletteIcon, SlidersPanelHorizontalIcon, ArrowDownNarrowWideIcon, BoxIcon, TextAlignRightIcon } from 'lucide-react';
import { themeSettings, colorThemes } from '@/lib/theme-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { typography } from '@/utils/accessibility-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function ThemeAudit() {
  return (
    <Page>
      <PageHeader 
        title="Theme & Accessibility Audit" 
        description="Review theme consistency and accessibility compliance"
        icon={<SlidersPanelHorizontalIcon className="h-6 w-6" />}
      />
      
      <Tabs defaultValue="colors">
        <TabsList className="mb-4">
          <TabsTrigger value="colors">
            <PaletteIcon className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <TextAlignRightIcon className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="spacing">
            <ArrowDownNarrowWideIcon className="h-4 w-4 mr-2" />
            Spacing
          </TabsTrigger>
          <TabsTrigger value="components">
            <BoxIcon className="h-4 w-4 mr-2" />
            Components
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
              <CardDescription>Core brand and UI colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch name="Primary" color={themeSettings.colors.primary} colorName="primary" />
                <ColorSwatch name="Primary Light" color={themeSettings.colors.primaryLight} colorName="primary/20" />
                <ColorSwatch name="Azure Blue" color={themeSettings.colors.azureBlue} colorName="azure.blue" />
                <ColorSwatch name="TBWA Yellow" color={themeSettings.colors.tbwaYellow} colorName="tbwa.yellow" />
                <ColorSwatch name="Background" color={themeSettings.colors.background} colorName="background" />
                <ColorSwatch name="Card" color={themeSettings.colors.card} colorName="card" />
                <ColorSwatch name="Border" color={themeSettings.colors.border} colorName="border" />
                <ColorSwatch name="Muted" color={themeSettings.colors.muted} colorName="muted" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Functional Colors</CardTitle>
              <CardDescription>Colors with semantic meaning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch name="Success" color={themeSettings.colors.success} colorName="success" />
                <ColorSwatch name="Error" color={themeSettings.colors.error} colorName="error" />
                <ColorSwatch name="Warning" color={themeSettings.colors.warning} colorName="warning" />
                <ColorSwatch name="Info" color={themeSettings.colors.info} colorName="info" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Theme Variants</CardTitle>
              <CardDescription>Color themes for specific elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Priority Colors</h3>
                <div className="flex flex-wrap gap-4">
                  <ThemeVariant name="High Priority" theme={colorThemes.priority.high} />
                  <ThemeVariant name="Medium Priority" theme={colorThemes.priority.medium} />
                  <ThemeVariant name="Low Priority" theme={colorThemes.priority.low} />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-3">Role Colors</h3>
                <div className="flex flex-wrap gap-4">
                  <ThemeVariant name="Client" theme={colorThemes.role.client} />
                  <ThemeVariant name="Internal" theme={colorThemes.role.internal} />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-3">Medallion Tier Colors</h3>
                <div className="flex flex-wrap gap-4">
                  <ThemeVariant name="Bronze" theme={colorThemes.tier.bronze} />
                  <ThemeVariant name="Silver" theme={colorThemes.tier.silver} />
                  <ThemeVariant name="Gold" theme={colorThemes.tier.gold} />
                  <ThemeVariant name="Platinum" theme={colorThemes.tier.platinum} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>Standard text styles and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h1 className={typography.h1}>Heading 1 (typography.h1)</h1>
                <h2 className={typography.h2}>Heading 2 (typography.h2)</h2>
                <h3 className={typography.h3}>Heading 3 (typography.h3)</h3>
                <h4 className={typography.h4}>Heading 4 (typography.h4)</h4>
                <p className={typography.body}>Body text (typography.body) - The quick brown fox jumps over the lazy dog.</p>
                <p className={typography.small}>Small text (typography.small) - The quick brown fox jumps over the lazy dog.</p>
                <p className={typography.muted}>Muted text (typography.muted) - The quick brown fox jumps over the lazy dog.</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-3">Font Weights</h3>
                <div className="space-y-2">
                  <p className="font-normal">Normal weight (400) - The quick brown fox jumps over the lazy dog.</p>
                  <p className="font-medium">Medium weight (500) - The quick brown fox jumps over the lazy dog.</p>
                  <p className="font-semibold">Semibold weight (600) - The quick brown fox jumps over the lazy dog.</p>
                  <p className="font-bold">Bold weight (700) - The quick brown fox jumps over the lazy dog.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="spacing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spacing Scale</CardTitle>
              <CardDescription>Standard spacing values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Padding Examples</h3>
                  <div className="flex flex-wrap gap-4">
                    {[1, 2, 3, 4, 6, 8].map(size => (
                      <div key={size} className="text-center">
                        <div className={`p-${size} bg-primary/10 border border-primary/20 rounded`}>
                          p-{size}
                        </div>
                        <span className="text-xs text-muted-foreground block mt-1">
                          {size * 4}px
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Gap Examples</h3>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 6, 8].map(size => (
                      <div key={size}>
                        <div className={`flex gap-${size} items-center mb-1`}>
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-6 w-6 bg-primary/20 rounded"></div>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          gap-{size} ({size * 4}px)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Margin Examples</h3>
                  <div className="space-y-8">
                    {[1, 2, 3, 4, 6, 8].map(size => (
                      <div key={size} className="relative h-12 bg-muted/20 rounded">
                        <div className={`absolute left-0 top-0 mb-${size} h-6 w-24 bg-primary/20 rounded flex items-center justify-center text-xs`}>
                          mb-{size} ({size * 4}px)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Standard button styles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Button Sizes</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="lg">Large</Button>
                  <Button size="default">Default</Button>
                  <Button size="sm">Small</Button>
                  <Button size="icon" className="rounded-full">
                    <PaletteIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Badge Variants</CardTitle>
              <CardDescription>Standard badge styles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Card Variants</CardTitle>
              <CardDescription>Standard card styles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Default Card</CardTitle>
                    <CardDescription>This is a default card</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Card content goes here. This is the standard card style without any modifications.</p>
                  </CardContent>
                </Card>
                
                <div className="shadow-glass p-6 border border-white/20 rounded-lg bg-white/70 backdrop-blur-sm">
                  <h3 className="text-lg font-medium mb-2">Glass Card</h3>
                  <p className="text-sm text-muted-foreground">Custom glass card style with backdrop blur and translucent background.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}

// Color swatch component
function ColorSwatch({ name, color, colorName }: { name: string; color: string; colorName: string }) {
  return (
    <div className="space-y-1.5">
      <div 
        className="h-16 w-full rounded-md border"
        style={{ backgroundColor: color }}
      />
      <div className="text-sm font-medium">{name}</div>
      <div className="text-xs text-muted-foreground">{colorName}</div>
    </div>
  );
}

// Theme variant component
function ThemeVariant({ name, theme }: { name: string; theme: any }) {
  return (
    <div className={`p-3 rounded-md ${theme.bg} ${theme.border ? 'border ' + theme.border : ''}`}>
      <div className={`flex items-center gap-2 ${theme.text}`}>
        <div className={`h-4 w-4 rounded-full ${theme.icon ? theme.icon.replace('text-', 'bg-') : ''}`}></div>
        <span className="font-medium">{name}</span>
      </div>
      <p className={`text-xs mt-1 ${theme.text}`}>
        This is an example of the {name.toLowerCase()} theme variant.
      </p>
    </div>
  );
}