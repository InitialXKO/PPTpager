'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Monitor, 
  Wifi, 
  WifiOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';
import { ConnectionState, Presentation } from '@/types';
import { formatTime } from '@/utils';

interface ControllerInterfaceProps {
  connectionState: ConnectionState;
  presentation: Presentation | null;
  currentSlide: number;
  onSlideChange: (direction: 'next' | 'prev' | 'goto', slideNumber?: number) => void;
  onBackToHome: () => void;
}

export default function ControllerInterface({
  connectionState,
  presentation,
  currentSlide = 0,
  onSlideChange,
  onBackToHome,
}: ControllerInterfaceProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentSlideData = presentation?.slides[currentSlide];
  const totalSlides = presentation?.slides.length || 0;

  const handlePreviousSlide = () => {
    if (connectionState.isConnected && onSlideChange) {
      onSlideChange('prev');
    }
  };

  const handleNextSlide = () => {
    if (connectionState.isConnected && onSlideChange) {
      onSlideChange('next');
    }
  };

  const toggleFullscreen = () => {
    setFullscreenMode(!fullscreenMode);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className={`min-h-screen ${fullscreenMode ? 'bg-black' : 'bg-gradient-to-br from-gray-50 to-white'} transition-colors duration-300`}>
      {/* Header - 隐藏在全屏模式下 */}
      {!fullscreenMode && (
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="text-sm">首页</span>
            </button>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                房间 {connectionState.roomId}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(currentTime)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {connectionState.isConnected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`${fullscreenMode ? 'h-screen' : 'h-screen flex flex-col'}`}>
        {/* 题词显示区域 - 核心功能 */}
        <div className={`${fullscreenMode ? 'flex-1 flex items-center justify-center p-4' : 'flex-1 flex items-center justify-center p-6'} ${!fullscreenMode ? 'pb-24' : ''}`}>
          {currentSlideData ? (
            <div className={`w-full ${fullscreenMode ? 'max-w-4xl' : 'max-w-md'}`}>
              {/* 幻灯片预览 */}
              <div className="mb-6 text-center">
                <div className="inline-block bg-white rounded-lg shadow-sm border p-3 mb-4">
                  <div className="text-sm font-medium text-gray-700">
                    {currentSlideData.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentSlide + 1} / {totalSlides}
                  </div>
                </div>
              </div>

              {/* 题词内容 - 大字体显示 */}
              <div className={`television-text-mobile ${fullscreenMode ? 'television-text' : ''} text-center leading-relaxed`}>
                {currentSlideData.notes || currentSlideData.title}
              </div>
              
              {/* 幻灯片内容预览 */}
              {currentSlideData.content && currentSlideData.content.length > 0 && (
                <div className="mt-6 text-center">
                  <div className="inline-block bg-blue-50 rounded-lg border border-blue-200 p-3">
                    <div className="text-sm text-blue-800 font-medium">
                      幻灯片内容
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {currentSlideData.content.slice(0, 3).join(' • ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>等待演示文稿加载...</p>
            </div>
          )}
        </div>

        {/* 控制按钮区域 */}
        <div className={`${fullscreenMode ? 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-50' : ''} p-4`}>
          <div className={`flex items-center justify-center space-x-6 ${fullscreenMode ? 'max-w-md mx-auto' : ''}`}>
            {/* 上一页按钮 */}
            <button
              onClick={handlePreviousSlide}
              disabled={!currentSlideData || currentSlide === 0}
              className={`control-button ${currentSlide === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${fullscreenMode ? 'p-6' : ''}`}
            >
              <ChevronLeft className={`${fullscreenMode ? 'w-8 h-8' : 'w-6 h-6'}`} />
            </button>

            {/* 全屏/退出全屏按钮 */}
            <button
              onClick={toggleFullscreen}
              className="control-button"
            >
              {fullscreenMode ? (
                <Minimize className="w-6 h-6" />
              ) : (
                <Maximize className="w-6 h-6" />
              )}
            </button>

            {/* 音效按钮 */}
            <button
              onClick={toggleSound}
              className="control-button"
            >
              {soundEnabled ? (
                <Volume2 className="w-6 h-6" />
              ) : (
                <VolumeX className="w-6 h-6" />
              )}
            </button>

            {/* 下一页按钮 */}
            <button
              onClick={handleNextSlide}
              disabled={!currentSlideData || currentSlide >= totalSlides - 1}
              className={`control-button ${currentSlide >= totalSlides - 1 ? 'opacity-50 cursor-not-allowed' : ''} ${fullscreenMode ? 'p-6' : ''}`}
            >
              <ChevronRight className={`${fullscreenMode ? 'w-8 h-8' : 'w-6 h-6'}`} />
            </button>
          </div>

          {/* 状态信息 */}
          {!fullscreenMode && (
            <div className="mt-4 text-center text-xs text-gray-500">
              {connectionState.isConnected ? (
                <span>已连接到房间 {connectionState.roomId}</span>
              ) : (
                <span className="text-red-500">连接已断开</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}