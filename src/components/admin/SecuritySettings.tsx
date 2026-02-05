import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, Mail, Globe, Key, Fingerprint, Save, Plus, X, RefreshCw } from 'lucide-react';

interface SecuritySettings {
  account_lockout: {
    max_attempts: number;
    lockout_duration_minutes: number;
    enabled: boolean;
  };
  ip_allowlist: {
    enabled: boolean;
    enforce_for_all_admins: boolean;
  };
  session_fingerprinting: {
    enabled: boolean;
    alert_on_change: boolean;
  };
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_number: boolean;
    require_special: boolean;
    password_history_count: number;
  };
  email_verification: {
    required_for_access: boolean;
    grace_period_hours: number;
  };
  security_email_alerts: {
    enabled: boolean;
    alert_emails: string[];
  };
}

const SecuritySettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [ipAllowlist, setIpAllowlist] = useState<{ id: string; ip_address: string; description: string; is_active: boolean }[]>([]);
  const [newIp, setNewIp] = useState('');
  const [newIpDesc, setNewIpDesc] = useState('');
  const [newAlertEmail, setNewAlertEmail] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchIpAllowlist();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_security_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsObj: Partial<SecuritySettings> = {};
      data?.forEach(item => {
        settingsObj[item.setting_key as keyof SecuritySettings] = item.setting_value as any;
      });

      setSettings(settingsObj as SecuritySettings);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load security settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchIpAllowlist = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_ip_allowlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIpAllowlist(data || []);
    } catch (error) {
      console.error('Error fetching IP allowlist:', error);
    }
  };

  const updateSetting = async (key: keyof SecuritySettings, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_security_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      toast({
        title: 'Success',
        description: 'Setting updated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addIpToAllowlist = async () => {
    if (!newIp.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('admin_ip_allowlist')
        .insert({
          ip_address: newIp.trim(),
          description: newIpDesc.trim() || null,
          added_by: user.id
        });

      if (error) throw error;

      setNewIp('');
      setNewIpDesc('');
      fetchIpAllowlist();
      toast({ title: 'Success', description: 'IP added to allowlist' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add IP',
        variant: 'destructive'
      });
    }
  };

  const removeIpFromAllowlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_ip_allowlist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchIpAllowlist();
      toast({ title: 'Success', description: 'IP removed from allowlist' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove IP',
        variant: 'destructive'
      });
    }
  };

  const addAlertEmail = () => {
    if (!newAlertEmail.trim() || !settings) return;
    
    const emails = [...(settings.security_email_alerts.alert_emails || []), newAlertEmail.trim()];
    updateSetting('security_email_alerts', {
      ...settings.security_email_alerts,
      alert_emails: emails
    });
    setNewAlertEmail('');
  };

  const removeAlertEmail = (email: string) => {
    if (!settings) return;
    
    const emails = settings.security_email_alerts.alert_emails.filter(e => e !== email);
    updateSetting('security_email_alerts', {
      ...settings.security_email_alerts,
      alert_emails: emails
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-brand-red">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-red" />
          <h2 className="text-xl font-bold text-white">Security Settings</h2>
        </div>
        <Badge variant="outline" className="border-brand-green text-brand-green">
          {saving ? 'Saving...' : 'Auto-save enabled'}
        </Badge>
      </div>

      <Tabs defaultValue="lockout" className="w-full">
        <TabsList className="bg-brand-dark border border-brand-green/20 flex-wrap h-auto">
          <TabsTrigger value="lockout" className="data-[state=active]:bg-brand-red">
            <Lock className="h-4 w-4 mr-2" />
            Account Lockout
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-brand-red">
            <Key className="h-4 w-4 mr-2" />
            Password Policy
          </TabsTrigger>
          <TabsTrigger value="session" className="data-[state=active]:bg-brand-red">
            <Fingerprint className="h-4 w-4 mr-2" />
            Session Security
          </TabsTrigger>
          <TabsTrigger value="ip" className="data-[state=active]:bg-brand-red">
            <Globe className="h-4 w-4 mr-2" />
            IP Allowlist
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-brand-red">
            <Mail className="h-4 w-4 mr-2" />
            Email Alerts
          </TabsTrigger>
        </TabsList>

        {/* Account Lockout Settings */}
        <TabsContent value="lockout" className="space-y-4 mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Account Lockout Configuration</CardTitle>
              <CardDescription>
                Automatically lock accounts after multiple failed login attempts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="lockout-enabled" className="text-brand-green">Enable Account Lockout</Label>
                <Switch
                  id="lockout-enabled"
                  checked={settings.account_lockout.enabled}
                  onCheckedChange={(checked) => updateSetting('account_lockout', {
                    ...settings.account_lockout,
                    enabled: checked
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-attempts" className="text-brand-green">Max Failed Attempts</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.account_lockout.max_attempts}
                    onChange={(e) => updateSetting('account_lockout', {
                      ...settings.account_lockout,
                      max_attempts: parseInt(e.target.value) || 5
                    })}
                    className="bg-brand-dark border-brand-green/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="lockout-duration" className="text-brand-green">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockout-duration"
                    type="number"
                    min={1}
                    max={1440}
                    value={settings.account_lockout.lockout_duration_minutes}
                    onChange={(e) => updateSetting('account_lockout', {
                      ...settings.account_lockout,
                      lockout_duration_minutes: parseInt(e.target.value) || 30
                    })}
                    className="bg-brand-dark border-brand-green/20 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Policy Settings */}
        <TabsContent value="password" className="space-y-4 mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Password Policy</CardTitle>
              <CardDescription>
                Configure password requirements and history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="min-length" className="text-brand-green">Minimum Password Length</Label>
                <Input
                  id="min-length"
                  type="number"
                  min={8}
                  max={32}
                  value={settings.password_policy.min_length}
                  onChange={(e) => updateSetting('password_policy', {
                    ...settings.password_policy,
                    min_length: parseInt(e.target.value) || 8
                  })}
                  className="bg-brand-dark border-brand-green/20 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-brand-green">Require Uppercase</Label>
                  <Switch
                    checked={settings.password_policy.require_uppercase}
                    onCheckedChange={(checked) => updateSetting('password_policy', {
                      ...settings.password_policy,
                      require_uppercase: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-brand-green">Require Lowercase</Label>
                  <Switch
                    checked={settings.password_policy.require_lowercase}
                    onCheckedChange={(checked) => updateSetting('password_policy', {
                      ...settings.password_policy,
                      require_lowercase: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-brand-green">Require Number</Label>
                  <Switch
                    checked={settings.password_policy.require_number}
                    onCheckedChange={(checked) => updateSetting('password_policy', {
                      ...settings.password_policy,
                      require_number: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-brand-green">Require Special Character</Label>
                  <Switch
                    checked={settings.password_policy.require_special}
                    onCheckedChange={(checked) => updateSetting('password_policy', {
                      ...settings.password_policy,
                      require_special: checked
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="history-count" className="text-brand-green">Password History Count</Label>
                <p className="text-xs text-brand-green/60 mb-2">Prevent reuse of last N passwords</p>
                <Input
                  id="history-count"
                  type="number"
                  min={0}
                  max={24}
                  value={settings.password_policy.password_history_count}
                  onChange={(e) => updateSetting('password_policy', {
                    ...settings.password_policy,
                    password_history_count: parseInt(e.target.value) || 0
                  })}
                  className="bg-brand-dark border-brand-green/20 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Security Settings */}
        <TabsContent value="session" className="space-y-4 mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Session Fingerprinting</CardTitle>
              <CardDescription>
                Detect and alert on suspicious device/browser changes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-brand-green">Enable Session Fingerprinting</Label>
                <Switch
                  checked={settings.session_fingerprinting.enabled}
                  onCheckedChange={(checked) => updateSetting('session_fingerprinting', {
                    ...settings.session_fingerprinting,
                    enabled: checked
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-brand-green">Alert on New Device</Label>
                <Switch
                  checked={settings.session_fingerprinting.alert_on_change}
                  onCheckedChange={(checked) => updateSetting('session_fingerprinting', {
                    ...settings.session_fingerprinting,
                    alert_on_change: checked
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Email Verification</CardTitle>
              <CardDescription>
                Require users to verify their email before accessing features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-brand-green">Require Email Verification</Label>
                <Switch
                  checked={settings.email_verification.required_for_access}
                  onCheckedChange={(checked) => updateSetting('email_verification', {
                    ...settings.email_verification,
                    required_for_access: checked
                  })}
                />
              </div>
              <div>
                <Label htmlFor="grace-period" className="text-brand-green">Grace Period (hours)</Label>
                <p className="text-xs text-brand-green/60 mb-2">Time allowed before verification is enforced</p>
                <Input
                  id="grace-period"
                  type="number"
                  min={0}
                  max={168}
                  value={settings.email_verification.grace_period_hours}
                  onChange={(e) => updateSetting('email_verification', {
                    ...settings.email_verification,
                    grace_period_hours: parseInt(e.target.value) || 24
                  })}
                  className="bg-brand-dark border-brand-green/20 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Allowlist */}
        <TabsContent value="ip" className="space-y-4 mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Admin IP Allowlist</CardTitle>
              <CardDescription>
                Restrict admin access to specific IP addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-brand-green">Enable IP Allowlist</Label>
                <Switch
                  checked={settings.ip_allowlist.enabled}
                  onCheckedChange={(checked) => updateSetting('ip_allowlist', {
                    ...settings.ip_allowlist,
                    enabled: checked
                  })}
                />
              </div>

              {settings.ip_allowlist.enabled && (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="IP Address (e.g., 192.168.1.1)"
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                      className="bg-brand-dark border-brand-green/20 text-white"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newIpDesc}
                      onChange={(e) => setNewIpDesc(e.target.value)}
                      className="bg-brand-dark border-brand-green/20 text-white"
                    />
                    <Button onClick={addIpToAllowlist} className="bg-brand-red hover:bg-brand-accent-red">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {ipAllowlist.map((ip) => (
                      <div key={ip.id} className="flex items-center justify-between p-2 bg-brand-dark rounded border border-brand-green/20">
                        <div>
                          <span className="text-white font-mono">{ip.ip_address}</span>
                          {ip.description && (
                            <span className="text-brand-green/60 ml-2 text-sm">({ip.description})</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIpFromAllowlist(ip.id)}
                          className="text-brand-red hover:text-brand-accent-red"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {ipAllowlist.length === 0 && (
                      <p className="text-brand-green/60 text-sm text-center py-4">
                        No IPs in allowlist. Add IPs above to restrict admin access.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Alerts */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Security Email Alerts</CardTitle>
              <CardDescription>
                Configure email notifications for security events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-brand-green">Enable Email Alerts</Label>
                <Switch
                  checked={settings.security_email_alerts.enabled}
                  onCheckedChange={(checked) => updateSetting('security_email_alerts', {
                    ...settings.security_email_alerts,
                    enabled: checked
                  })}
                />
              </div>

              {settings.security_email_alerts.enabled && (
                <>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Add alert email address"
                      value={newAlertEmail}
                      onChange={(e) => setNewAlertEmail(e.target.value)}
                      className="bg-brand-dark border-brand-green/20 text-white"
                    />
                    <Button onClick={addAlertEmail} className="bg-brand-red hover:bg-brand-accent-red">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {settings.security_email_alerts.alert_emails.map((email) => (
                      <Badge key={email} variant="secondary" className="bg-brand-dark text-brand-green">
                        {email}
                        <button
                          onClick={() => removeAlertEmail(email)}
                          className="ml-2 hover:text-brand-red"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {settings.security_email_alerts.alert_emails.length === 0 && (
                      <p className="text-brand-green/60 text-sm">
                        No custom emails. Alerts will be sent to all admin users.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecuritySettings;
