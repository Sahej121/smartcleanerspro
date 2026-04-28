'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to DrycleanersFlow', message: 'Your professional POS is ready to use.', type: 'info', read: false, time: new Date().toISOString() },
    { id: 2, title: 'New Feature: Discounts', message: 'You can now apply discounts at checkout.', type: 'success', read: false, time: new Date().toISOString() }
  ]);

  const addNotification = (notif) => {
    setNotifications(prev => [{
      id: Date.now(),
      read: false,
      time: new Date().toISOString(),
      ...notif
    }, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
