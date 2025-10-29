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
  const presentationRef = useRef<Presentation | null>(null);

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

    socketRef.current.on('slide_changed', (payload: { slideNumber?: number }) => {
      if (typeof payload?.slideNumber !== 'number' || Number.isNaN(payload.slideNumber)) {
        return;
      }

      const currentPresentation = presentationRef.current;
      const maxIndex = currentPresentation && currentPresentation.slides.length > 0
        ? currentPresentation.slides.length - 1
        : 0;

      const nextSlide = Math.max(0, Math.min(payload.slideNumber, maxIndex));

      setCurrentSlide(nextSlide);
      setPresentation((prev) => {
        if (!prev) {
          return prev;
        }
        if (prev.currentSlide === nextSlide) {
          return prev;
        }
        const updated = {
          ...prev,
          currentSlide: nextSlide,
        };
        presentationRef.current = updated;
        return updated;
      });
    });

    socketRef.current.on('presentation_loaded', (data: { presentation: Presentation }) => {
      const incoming = data.presentation;
      const maxIndex = incoming.slides.length > 0 ? incoming.slides.length - 1 : 0;
      const initialSlide =
        typeof incoming.currentSlide === 'number'
          ? Math.max(0, Math.min(incoming.currentSlide, maxIndex))
          : 0;

      const normalizedPresentation: Presentation = {
        ...incoming,
        currentSlide: initialSlide,
      };

      presentationRef.current = normalizedPresentation;
      setPresentation(normalizedPresentation);
      setCurrentSlide(initialSlide);
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

  // 更新 presentationRef 当 presentation 变化时
  useEffect(() => {
    presentationRef.current = presentation;
  }, [presentation]);

  // 发送幻灯片变化
  const changeSlide = useCallback((direction: 'next' | 'prev' | 'goto', slideNumber?: number) => {
    if (!socketRef.current?.connected || !connectionState.roomId) return;

    const currentPresentation = presentationRef.current;
    const totalSlides = currentPresentation?.slides.length ?? 0;
    if (totalSlides === 0) return;

    setCurrentSlide((prevSlide) => {
      let targetSlide = prevSlide;

      if (direction === 'goto' && typeof slideNumber === 'number') {
        targetSlide = Math.max(0, Math.min(slideNumber, totalSlides - 1));
      } else if (direction === 'next') {
        targetSlide = Math.min(prevSlide + 1, totalSlides - 1);
      } else if (direction === 'prev') {
        targetSlide = Math.max(prevSlide - 1, 0);
      }

      if (targetSlide === prevSlide) {
        return prevSlide;
      }

      const message = {
        type: 'slide_change',
        roomId: connectionState.roomId,
        deviceId: connectionState.deviceId,
        timestamp: Date.now(),
        data: {
          slideNumber: targetSlide,
          direction,
        },
      };

      socketRef.current?.emit('slide_change', message);

      // 更新 presentation 的 currentSlide
      setPresentation((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          currentSlide: targetSlide,
        };
      });

      return targetSlide;
    });
  }, [connectionState.roomId, connectionState.deviceId]);

  // 加载演示文稿
  const loadPresentation = useCallback((presentationData: Presentation) => {
    if (!socketRef.current?.connected || !connectionState.roomId) return;

    const maxIndex = presentationData.slides.length > 0 ? presentationData.slides.length - 1 : 0;
    const initialSlide = Math.max(0, Math.min(presentationData.currentSlide ?? 0, maxIndex));

    const normalizedPresentation: Presentation = {
      ...presentationData,
      currentSlide: initialSlide,
    };

    const message: ControlMessage = {
      type: 'presentation_load',
      roomId: connectionState.roomId,
      deviceId: connectionState.deviceId,
      timestamp: Date.now(),
      data: {
        presentation: normalizedPresentation,
      },
    };

    socketRef.current.emit('load_presentation', message);
    presentationRef.current = normalizedPresentation;
    setPresentation(normalizedPresentation);
    setCurrentSlide(initialSlide);
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