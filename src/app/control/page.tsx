'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { isValidRoomCode, generateDeviceName } from '@/utils';
import { Wifi, WifiOff, Home, Monitor, Smartphone } from 'lucide-react';
import ControllerInterface from '@/components/ControllerInterface';

export default function ControlPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get('room');
  
  const [inputRoomId, setInputRoomId] = useState(roomFromUrl || '');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  
  const {
    connect,
    joinRoom,
    changeSlide,
    connectionState,
    presentation,
    currentSlide,
    isConnected,
  } = useWebSocket();

  useEffect(() => {
    // 如果URL中有房间号，自动连接
    if (roomFromUrl && isValidRoomCode(roomFromUrl)) {
      setIsJoining(true);
      connect();
      setTimeout(() => {
        joinRoom(roomFromUrl, 'controller');
        setIsJoining(false);
      }, 1000);
    }
  }, [roomFromUrl, connect, joinRoom]);

  const handleJoinRoom = async () => {
    setError('');
    
    if (!inputRoomId.trim()) {
      setError('请输入房间号码');
      return;
    }

    if (!isValidRoomCode(inputRoomId.toUpperCase())) {
      setError('房间号码格式不正确（6位大写字母或数字）');
      return;
    }

    setIsJoining(true);
    
    try {
      connect();
      
      setTimeout(() => {
        joinRoom(inputRoomId.toUpperCase(), 'controller');
        setIsJoining(false);
      }, 1000);
    } catch (err) {
      console.error('连接失败:', err);
      setError('连接失败，请重试');
      setIsJoining(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleRoomInputChange = (value: string) => {
    // 自动转换为大写
    setInputRoomId(value.toUpperCase());
    setError('');
  };

  // 已连接状态，显示控制界面
  if (isConnected && connectionState.roomId) {
    return (
      <ControllerInterface
        connectionState={connectionState}
        presentation={presentation}
        currentSlide={currentSlide}
        onSlideChange={changeSlide}
        onBackToHome={handleBackToHome}
      />
    );
  }

  // 连接中状态
  if (isJoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            正在连接...
          </h2>
          <p className="text-gray-600">
            正在加入房间 {inputRoomId.toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  // 连接页面
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-5 h-5" />
            返回首页
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            手机控制台
          </h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-10 h-10 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              连接演示房间
            </h2>
            <p className="text-gray-600">
              输入房间号码，加入正在进行的PPT演示
            </p>
          </div>

          {/* 连接表单 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                房间号码
              </label>
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => handleRoomInputChange(e.target.value)}
                placeholder="输入6位房间号码"
                className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
                maxLength={6}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 text-center">
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!inputRoomId.trim() || isJoining}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                !inputRoomId.trim() || isJoining
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isJoining ? '连接中...' : '加入房间'}
            </button>

            {/* 帮助文本 */}
            <div className="mt-6 text-center">
              <h3 className="font-medium text-gray-900 mb-2">
                如何连接？
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. 在电脑端启动PPT演示</p>
                <p>2. 扫描二维码或记下房间号码</p>
                <p>3. 在此输入6位房间号码</p>
              </div>
            </div>
          </div>

          {/* 特性说明 */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4 text-center">
              控制功能
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-sm text-gray-700">遥控翻页</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-sm text-gray-700">题词显示</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-sm text-gray-700">实时同步</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}