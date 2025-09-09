import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

export interface NotificationData {
  postId?: string;
  commentId?: string;
  authorId?: string;
  authorName?: string;
  postTitle?: string;
  commentContent?: string;
  customUrl?: string;
  avatarUrl?: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
}

// Create a new notification
export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = await prisma.notifications.create({
      data: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: (params.data || {}) as any,
        isRead: false,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId: string, limit = 20, offset = 0) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Get unread notification count
export const getUnreadCount = async (userId: string) => {
  try {
    const count = await prisma.notifications.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId: string) => {
  try {
    await prisma.notifications.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string) => {
  try {
    await prisma.notifications.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string) => {
  try {
    await prisma.notifications.delete({
      where: { id: notificationId },
    });

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Helper function to create different types of notifications
export const createActivityNotification = async (
  userId: string,
  type: NotificationType,
  data: NotificationData
) => {
  let title = '';
  let message = '';

  // Helper function to get a meaningful post description
  const getPostDescription = () => {
    if (data.postTitle && data.postTitle.trim() && data.postTitle !== 'Untitled Post') {
      return data.postTitle.length > 50 ? data.postTitle.substring(0, 50) + '...' : data.postTitle;
    }
    return 'your post';
  };

  switch (type) {
    case NotificationType.POST_LIKE:
      title = `${data.authorName} liked your post`;
      message = data.postTitle && data.postTitle.trim() && data.postTitle !== 'Untitled Post'
        ? `"${getPostDescription()}"`
        : 'Someone liked your post';
      break;

    case NotificationType.POST_COMMENT:
      title = `${data.authorName} commented on your post`;
      message = data.postTitle && data.postTitle.trim() && data.postTitle !== 'Untitled Post'
        ? `on "${getPostDescription()}"`
        : 'Someone commented on your post';
      break;

    case NotificationType.COMMENT_REPLY:
      title = `${data.authorName} replied to your comment`;
      message = data.commentContent 
        ? `"${data.commentContent.length > 100 ? data.commentContent.substring(0, 100) + '...' : data.commentContent}"`
        : 'Someone replied to your comment';
      break;

    case NotificationType.MENTION:
      title = `${data.authorName} mentioned you`;
      message = data.postTitle 
        ? `in "${data.postTitle.length > 50 ? data.postTitle.substring(0, 50) + '...' : data.postTitle}"`
        : 'You were mentioned in a post';
      break;

    case NotificationType.BEST_ANSWER:
      title = 'Your comment was marked as best answer!';
      message = data.postTitle 
        ? `in "${data.postTitle.length > 50 ? data.postTitle.substring(0, 50) + '...' : data.postTitle}"`
        : 'Your comment was marked as the best answer';
      break;

    case NotificationType.NEW_FOLLOWER:
      title = `${data.authorName} started following you`;
      message = 'You have a new follower!';
      break;

    default:
      title = 'New notification';
      message = 'You have a new notification';
  }

  return createNotification({
    userId,
    type,
    title,
    message,
    data,
  });
};

// Get notifications with time formatting
export const getFormattedNotifications = async (userId: string, limit = 20) => {
  const notifications = await getUserNotifications(userId, limit);
  
  return notifications.map(notification => ({
    ...notification,
    timeAgo: getTimeAgo(notification.createdAt),
    data: notification.data as NotificationData,
  }));
};

// Utility function to format time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};
