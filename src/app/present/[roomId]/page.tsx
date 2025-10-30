'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { generateRoomCode, storage } from '@/utils';
import { Monitor, Wifi, WifiOff, Home, Users } from 'lucide-react';
import { Presentation } from '@/types';
import SlideViewer from '@/components/SlideViewer';
import ConnectionQR from '@/components/ConnectionQR';

export default function PresentPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string || '';
  
  const {
    connect,
    joinRoom,
    loadPresentation,
    changeSlide,
    connectionState,
    presentation,
    currentSlide,
    isConnected,
  } = useWebSocket();
  
  const [showQR, setShowQR] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    // 连接到WebSocket并加入房间
    connect(() => {
      if (roomId) {
        joinRoom(roomId, 'presenter');
        setShowQR(true);
      }
    });
  }, [roomId, connect, joinRoom]);

  useEffect(() => {
    // 加载演示文稿
    const sessionData = storage.get('ppt_session');
    if (sessionData?.presentation && roomId) {
      loadPresentation(sessionData.presentation);
    }
  }, [roomId, loadPresentation]);

  useEffect(() => {
    // 监听设备连接数变化
    setConnectionCount(connectionState.devices.length);
  }, [connectionState.devices]);

  const handleBackToHome = () => {
    router.push('/');
  };

  const toggleQR = () => {
    setShowQR(!showQR);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-5 h-5" />
              首页
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold text-gray-900">
              PPT遥控器演示
            </h1>
            <div className="room-code">
              {roomId}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 连接状态 */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <span className={`connection-indicator ${
                isConnected ? 'connection-connected' : 'connection-disconnected'
              }`}>
                {isConnected ? '已连接' : '连接断开'}
              </span>
            </div>
            
            {/* 连接设备数 */}
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {connectionCount} 个设备
              </span>
            </div>
            
            {/* QR码切换按钮 */}
            <button
              onClick={toggleQR}
              className="btn-primary"
            >
              {showQR ? '隐藏二维码' : '显示二维码'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* 主显示区域 */}
        <div className={`${showQR ? 'w-3/4' : 'w-full'} transition-all duration-300`}>
          {presentation ? (
            <SlideViewer
              presentation={presentation}
              currentSlide={currentSlide}
              onSlideChange={(slideNumber) => changeSlide('goto', slideNumber)}
            />
          ) : (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  等待演示文稿加载...
                </h2>
                <p className="text-gray-600">
                  请确保手机已连接到房间 {roomId}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* QR码侧边栏 */}
        {showQR && (
          <div className="w-1/4 bg-white border-l border-gray-200 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                手机扫码连接
              </h3>
              <ConnectionQR roomId={roomId} />
              <div className="mt-6 text-sm text-gray-600">
                <p className="mb-2">1. 打开手机相机或微信扫码</p>
                <p className="mb-2">2. 进入PPT遥控器页面</p>
                <p>3. 输入房间号：{roomId}</p>
              </div>
              
              {connectionCount > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">
                    已连接设备
                  </h4>
                  <div className="space-y-1">
                    {connectionState.devices.map((device, index) => (
                      <div key={index} className="text-sm text-green-700">
                        {device.name || device.id}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}