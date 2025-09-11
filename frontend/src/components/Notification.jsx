import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../store/redux/notificationSlice';
import {
  Bell,
  CheckCheck,
  Trash2,
  XCircle,
  FileText,
  CreditCard,
  MessageCircle,
  Megaphone,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { notifications, unreadCount, status, error } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }
    if (notification.navigateLink) {
      if (notification.navigateLink.startsWith('http')) {
        window.open(notification.navigateLink, '_blank', 'noopener,noreferrer');
      } else {
        navigate(notification.navigateLink);
      }
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleDeleteNotification = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const getIconForType = (type) => {
    const commonProps = { size: 20, className: "text-white" };
    switch (type) {
      case 'system': return <Bell {...commonProps} />;
      case 'course': return <FileText {...commonProps} />;
      case 'payment': return <CreditCard {...commonProps} />;
      case 'event': return <Calendar {...commonProps} />;
      case 'announcement': return <Megaphone {...commonProps} />;
      default: return <Bell {...commonProps} />;
    }
  };
  
  const iconBgColor = useMemo(() => ({
      system: 'bg-slate-500',
      course: 'bg-blue-500',
      payment: 'bg-green-500',
      event: 'bg-purple-500',
      announcement: 'bg-orange-500',
  }), []);


  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <Bell className="text-primary"/>
          Notifications
        </h1>
        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors"
          >
            <CheckCheck size={16} />
            Mark all read ({unreadCount})
          </motion.button>
        )}
      </motion.div>

      {status === 'loading' && <p className="text-center text-muted-foreground">Loading...</p>}
      {status === 'failed' && <p className="text-center text-destructive">Error: {error}</p>}
      
      {status === 'succeeded' && (
        notifications.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold">All Caught Up!</h2>
            <p className="text-muted-foreground mt-2">You have no new notifications.</p>
          </div>
        ) : (
          <div className="relative pl-8 border-l-2 border-border/40">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  layout
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative mb-8 last:mb-0 group"
                >
                  <div className={`absolute -left-[48px] top-0 w-8 h-8 rounded-full flex items-center justify-center ${iconBgColor[notification.type] || 'bg-slate-500'}`}>
                    {getIconForType(notification.type)}
                  </div>
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 rounded-lg border border-border cursor-pointer transition-all duration-300 ${notification.isRead ? 'bg-card/50 hover:bg-card/80 border-border' : 'bg-primary/10 hover:bg-primary/20 border-primary/20'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <p className={`font-semibold ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 ml-4 mt-1" title="Unread"/>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</p>
                       <button
                        onClick={(e) => handleDeleteNotification(e, notification._id)}
                        className="p-1 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Delete notification"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  );
};

export default NotificationsPage;