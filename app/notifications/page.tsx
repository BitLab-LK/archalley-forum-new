"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  Reply, 
  AtSign, 
  Award, 
  UserPlus, 
  Check, 
  CheckCheck,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface NotificationData {
  postId?: string;
  commentId?: string;
  authorId?: string;
  authorName?: string;
  postTitle?: string;
  commentContent?: string;
  customUrl?: string;
  avatarUrl?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: NotificationData;
  createdAt: string;
  timeAgo: string;
}

const getNotificationIcon = (type: string) => {
  const iconMap = {
    POST_LIKE: Heart,
    POST_COMMENT: MessageCircle,
    COMMENT_REPLY: Reply,
    MENTION: AtSign,
    BEST_ANSWER: Award,
    NEW_FOLLOWER: UserPlus,
    SYSTEM: Bell,
  };
  
  return iconMap[type as keyof typeof iconMap] || Bell;
};

const getNotificationColor = (type: string) => {
  const colorMap = {
    POST_LIKE: 'text-red-500 bg-red-50 dark:bg-red-950/20',
    POST_COMMENT: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20',
    COMMENT_REPLY: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20',
    MENTION: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20',
    BEST_ANSWER: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
    NEW_FOLLOWER: 'text-green-500 bg-green-50 dark:bg-green-950/20',
    SYSTEM: 'text-gray-500 bg-gray-50 dark:bg-gray-950/20',
  };
  
  return colorMap[type as keyof typeof colorMap] || 'text-gray-500 bg-gray-50 dark:bg-gray-950/20';
};

const getNotificationUrl = (notification: Notification) => {
  const { type, data } = notification;
  
  if (data.customUrl) {
    return data.customUrl;
  }
  
  if (data.postId) {
    // Navigate to main page with post highlighted (for now, until post detail page is created)
    return `/?highlight=${data.postId}`;
  }
  
  if (type === 'NEW_FOLLOWER' && data.authorId) {
    return `/profile/${data.authorId}`;
  }
  
  return '/';
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, markAsRead: true }),
      });
      
      setNotifications(prev => 
        prev.map(n => notificationIds.includes(n.id) ? { ...n, isRead: true } : n)
      );
      setSelectedIds([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      await Promise.all(
        notificationIds.map(id => 
          fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
        )
      );
      
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleNotifications = filteredNotifications;
    const allSelected = visibleNotifications.every(n => selectedIds.includes(n.id));
    
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleNotifications.map(n => n.id));
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || (filter === 'unread' && !n.isRead)
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <p>Please log in to view your notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with all the latest activities and interactions
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>
              
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead(selectedIds)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNotifications(selectedIds)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {filteredNotifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {filteredNotifications.every(n => selectedIds.includes(n.id)) ? 'Deselect all' : 'Select all'}
                </Button>
              )}
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotifications}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'unread' 
                ? 'All caught up! Check back later for new notifications.'
                : 'We\'ll notify you when something happens in the community.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            const colors = getNotificationColor(notification.type);
            const url = getNotificationUrl(notification);
            const isSelected = selectedIds.includes(notification.id);
            
            return (
              <Card 
                key={notification.id} 
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer",
                  !notification.isRead && "border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(notification.id)}
                        className="rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className={cn("p-2 rounded-full", colors)}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <Link 
                      href={url}
                      className="flex-1 min-w-0"
                      onClick={() => !notification.isRead && markAsRead([notification.id])}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "text-sm font-medium leading-tight mb-1",
                            !notification.isRead && "font-semibold"
                          )}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{notification.timeAgo}</span>
                            <span>•</span>
                            <span>{format(new Date(notification.createdAt), 'MMM d, yyyy')}</span>
                            {!notification.isRead && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs">New</Badge>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {notification.data.avatarUrl && (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={notification.data.avatarUrl} />
                            <AvatarFallback>
                              {notification.data.authorName?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
