"use client"

// Temporary mock for useSocket when SocketProvider is disabled
export const useSocket = () => {
  return {
    socket: null,
    isConnected: false,
    joinPost: () => {},
    leavePost: () => {}
  }
}