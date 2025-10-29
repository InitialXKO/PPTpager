'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ControlMessage, ConnectionState, Presentation } from '@/types';

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    roomId: null,
    deviceId: '',
    deviceType: 'presenter',
    devices: [],
  });

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 生成唯一设备ID
  const generateDeviceId = () => {
    return 'device_' + Math.random().toString(36).substr(2, 9) + Date.now();
  };

  // 初始化连接
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
    localStorage.setItem('deviceId', deviceId);

    socketRef.current = io({
      path: '/api/socket',
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setConnectionState(prev => ({
        ...prev,
        deviceId,
        isConnected: true,
      }));
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
      }));
    });

    socketRef.current.on('room_joined', (data: { roomId: string; devices: any[] }) => {
      setConnectionState(prev => ({
        ...prev,
        roomId: data.roomId,
        devices: data.devices,
      }));
    });

    socketRef.current.on('devices_updated', (devices: any[]) => {
      setConnectionState(prev => ({
        ...prev,
        devices,
      }));
    });

    socketRef.current.on('slide_changed', (data: { slideNumber: number }) => {
      setCurrentSlide(data.slideNumber);
    });

    socketRef.current.on('presentation_loaded', (data: { presentation: Presentation }) => {
      setPresentation(data.presentation);
      setCurrentSlide(0);
    });

    socketRef.current.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });

  }, []);

  // 加入房间
  const joinRoom = useCallback((roomId: string, deviceType: 'presenter' | 'controller' = 'presenter') => {
    if (!socketRef.current?.connected) return;

    const message: ControlMessage = {
      type: 'join',
      roomId,
      deviceId: connectionState.deviceId,
      timestamp: Date.now(),
      data: {
        deviceType,
        deviceName: `${deviceType}_${connectionState.deviceId}`,
      },
    };

    socketRef.current.emit('join_room', message);
    
    setConnectionState(prev => ({
      ...prev,
      deviceType,
    }));
  }, [connectionState.deviceId]);

  // 发送幻灯片变化
  const changeSlide = useCallback((direction: 'next' | 'prev' | 'goto', slideNumber?: number) => {
    if (!socketRef.current?.connected || !connectionState.roomId) return;

    const message = {
      type: 'slide_change',
      roomId: connectionState.roomId,
      deviceId: connectionState.deviceId,
      timestamp: Date.now(),
      data: {
        slideNumber: direction === 'goto' ? slideNumber : null,
        direction,
      },
    };

    socketRef.current.emit('slide_change', message);
  }, [connectionState.roomId, connectionState.deviceId]);

  // 加载演示文稿
  const loadPresentation = useCallback((presentation: Presentation) => {
    if (!socketRef.current?.connected || !connectionState.roomId) return;

    const message: ControlMessage = {
      type: 'presentation_load',
      roomId: connectionState.roomId,
      deviceId: connectionState.deviceId,
      timestamp: Date.now(),
      data: {
        presentation,
      },
    };

    socketRef.current.emit('load_presentation', message);
    setPresentation(presentation);
    setCurrentSlide(0);
  }, [connectionState.roomId, connectionState.deviceId]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        roomId: null,
        devices: [],
      }));
    }
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    joinRoom,
    changeSlide,
    loadPresentation,
    connectionState,
    presentation,
    currentSlide,
    isConnected: connectionState.isConnected,
  };
};