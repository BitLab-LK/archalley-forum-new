"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  X
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
    POST_LIKE: 'text-red-500',
    POST_COMMENT: 'text-blue-500',
    COMMENT_REPLY: 'text-purple-500',
    MENTION: 'text-orange-500',
    BEST_ANSWER: 'text-yellow-500',
    NEW_FOLLOWER: 'text-green-500',
    SYSTEM: 'text-gray-500',
  };
  
  return colorMap[type as keyof typeof colorMap] || 'text-gray-500';
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

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
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

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId], markAsRead: true }),
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-96 max-h-96" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-lg font-semibold">Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-6 px-2"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs">We'll notify you when something happens</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                const url = getNotificationUrl(notification);
                
                return (
                  <Link 
                    key={notification.id} 
                    href={url}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <DropdownMenuItem className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notification.isRead && "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-blue-500"
                    )}>
                      <div className={cn("mt-1", iconColor)}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm leading-tight",
                          !notification.isRead && "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timeAgo}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteNotification(notification.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                href="/notifications" 
                className="w-full text-center text-sm text-muted-foreground hover:text-primary"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
