import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';

interface SocketNotification {
  id: string;
  type: 'match' | 'connection' | 'accepted';
  title: string;
  message: string;
  timestamp: Date;
  data: any;
}

interface SocketContextType {
  socket: Socket | null;
  notifications: SocketNotification[];
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      query: { userId: user.id },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      // console.log('[Socket] Connected to real-time notification engine');
    });

    newSocket.on('match:found', (data: any) => {
      const notif: SocketNotification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        type: 'match',
        title: 'New Ancestor Match Found!',
        message: `We found a potential ${data.score}% match for your ancestor ${data.yourAncestor.firstName} ${data.yourAncestor.lastName} with ${data.otherUser.name}.`,
        timestamp: new Date(),
        data
      };
      setNotifications(prev => [notif, ...prev]);
    });

    newSocket.on('connection:requested', (data: any) => {
      const notif: SocketNotification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        type: 'connection',
        title: 'Relative Connection Request',
        message: `${data.requester.name} wants to connect with you as a ${data.relationType.toLowerCase()}.`,
        timestamp: new Date(),
        data
      };
      setNotifications(prev => [notif, ...prev]);
    });

    newSocket.on('connection:accepted', (data: any) => {
      const notif: SocketNotification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        type: 'accepted',
        title: 'Relative Connection Confirmed!',
        message: `Your connection is verified: ${data.kinshipTitle || 'Relative'}!`,
        timestamp: new Date(),
        data
      };
      setNotifications(prev => [notif, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, clearNotification, clearAllNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

