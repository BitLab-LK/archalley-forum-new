'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Bell, Settings } from 'lucide-react';

interface EmailPreferences {
  emailNotifications: boolean;
  notifyOnComment: boolean;
  notifyOnLike: boolean;
  notifyOnMention: boolean;
  notifyOnReply: boolean;
  notifyOnNewPost: boolean;
  notifyOnSystem: boolean;
  emailDigest: 'DISABLED' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export default function EmailPreferencesPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<EmailPreferences>({
    emailNotifications: true,
    notifyOnComment: true,
    notifyOnLike: true,
    notifyOnMention: true,
    notifyOnReply: true,
    notifyOnNewPost: false,
    notifyOnSystem: true,
    emailDigest: 'DISABLED'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchPreferences();
    }
  }, [status, session]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/users/preferences/email');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email preferences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/preferences/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Email preferences updated successfully'
        });
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email preferences',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof EmailPreferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to manage your email preferences.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Email Notifications
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage how and when you receive email notifications from the forum.
        </p>
      </div>

      <div className="space-y-6">
        {/* Master Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Master Settings
            </CardTitle>
            <CardDescription>
              Control your overall email notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for forum activities
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-digest" className="text-base font-medium">
                  Email Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive a summary of forum activity
                </p>
              </div>
              <Select
                value={preferences.emailDigest}
                onValueChange={(value) => updatePreference('emailDigest', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Activity Notifications
            </CardTitle>
            <CardDescription>
              Choose which activities trigger email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-comment" className="font-medium">
                    New Comments
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When someone comments on your posts
                  </p>
                </div>
                <Switch
                  id="notify-comment"
                  checked={preferences.notifyOnComment}
                  onCheckedChange={(checked) => updatePreference('notifyOnComment', checked)}
                  disabled={!preferences.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-like" className="font-medium">
                    Post Likes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When someone likes your posts or comments
                  </p>
                </div>
                <Switch
                  id="notify-like"
                  checked={preferences.notifyOnLike}
                  onCheckedChange={(checked) => updatePreference('notifyOnLike', checked)}
                  disabled={!preferences.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-mention" className="font-medium">
                    Mentions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When someone mentions you in a post or comment
                  </p>
                </div>
                <Switch
                  id="notify-mention"
                  checked={preferences.notifyOnMention}
                  onCheckedChange={(checked) => updatePreference('notifyOnMention', checked)}
                  disabled={!preferences.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-reply" className="font-medium">
                    Comment Replies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When someone replies to your comments
                  </p>
                </div>
                <Switch
                  id="notify-reply"
                  checked={preferences.notifyOnReply}
                  onCheckedChange={(checked) => updatePreference('notifyOnReply', checked)}
                  disabled={!preferences.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-new-post" className="font-medium">
                    New Posts in Followed Categories
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When new posts are created in categories you follow
                  </p>
                </div>
                <Switch
                  id="notify-new-post"
                  checked={preferences.notifyOnNewPost}
                  onCheckedChange={(checked) => updatePreference('notifyOnNewPost', checked)}
                  disabled={!preferences.emailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-system" className="font-medium">
                    System Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Important updates and announcements
                  </p>
                </div>
                <Switch
                  id="notify-system"
                  checked={preferences.notifyOnSystem}
                  onCheckedChange={(checked) => updatePreference('notifyOnSystem', checked)}
                  disabled={!preferences.emailNotifications}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const response = await fetch('/api/test/email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'SYSTEM' })
                });
                const result = await response.json();
                toast({
                  title: result.success ? 'Success' : 'Error',
                  description: result.message,
                  variant: result.success ? 'default' : 'destructive'
                });
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'Failed to send test email',
                  variant: 'destructive'
                });
              }
            }}
            disabled={saving || !preferences.emailNotifications}
          >
            Send Test Email
          </Button>
          <Button onClick={savePreferences} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>

        {/* Information Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h4 className="font-medium">💡 Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You need a verified email address to receive notifications</li>
                <li>• You can change these settings anytime</li>
                <li>• Email digest summarizes activity over your chosen period</li>
                <li>• System notifications include important security and policy updates</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
