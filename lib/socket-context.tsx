"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinPost: (postId: string) => void
  leavePost: (postId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinPost: () => {},
  leavePost: () => {}
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) {
      // If no user session, cleanup any existing socket
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Initialize socket connection
    const socketInstance = io({
      path: '/api/socketio',
      auth: {
        token: session.user.id
      },
      transports: ['websocket', 'polling'],
      timeout: 5000, // Reduced to 5 seconds
      reconnection: true,
      reconnectionDelay: 2000, // Increased delay
      reconnectionAttempts: 3, // Reduced attempts
      forceNew: true // Force new connection each time
    })

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Connected to Socket.IO server')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason)
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.warn('Socket.IO connection error (will retry):', error.message)
      setIsConnected(false)
      // Don't treat connection errors as critical - app should work without Socket.IO
    })

    socketInstance.on('error', (error) => {
      console.warn('Socket.IO error:', error)
      // Gracefully handle errors without breaking the app
    })

    socketInstance.on('reconnect_failed', () => {
      console.warn('Socket.IO reconnection failed - continuing without real-time features')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    // Cleanup on unmount or session change
    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [session?.user?.id])

  const joinPost = (postId: string) => {
    if (socket && isConnected) {
      socket.emit('join-post', postId)
    }
  }

  const leavePost = (postId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-post', postId)
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    joinPost,
    leavePost
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}