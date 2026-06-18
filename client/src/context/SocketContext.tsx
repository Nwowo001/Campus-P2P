import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  isUserOnline: (userId: string) => boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5000');
    console.log('[Socket] Connecting to server...', socketUrl);
    
    const newSocket = io(socketUrl, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server! Socket ID:', newSocket.id);
    });

    newSocket.on('user_status_change', (data: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers((prev) => {
        if (data.status === 'online') {
          if (prev.includes(data.userId)) return prev;
          return [...prev, data.userId];
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log('[Socket] Disconnected');
    };
  }, [token, user]);

  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
