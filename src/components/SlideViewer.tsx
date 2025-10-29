'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Presentation } from '@/types';

interface SlideViewerProps {
  presentation: Presentation;
  currentSlide: number;
  onSlideChange?: (slideNumber: number) => void;
}

export default function SlideViewer({ 
  presentation, 
  currentSlide = 0,
  onSlideChange 
}: SlideViewerProps) {
  const slide = presentation.slides[currentSlide];

  const handlePrevious = () => {
    if (currentSlide > 0) {
      onSlideChange?.(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < presentation.slides.length - 1) {
      onSlideChange?.(currentSlide + 1);
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
      case ' ':
        handleNext();
        break;
      case 'Home':
        onSlideChange?.(0);
        break;
      case 'End':
        onSlideChange?.(presentation.slides.length - 1);
        break;
    }
  };

  return (
    <div className="slide-container">
      {/* 幻灯片内容 */}
      <div className="h-full flex flex-col">
        {/* 幻灯片标题栏 */}
        <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium">{slide.title}</h2>
            <span className="text-sm text-gray-300">
              {currentSlide + 1} / {presentation.slides.length}
            </span>
          </div>
          <div className="text-sm text-gray-300">
            {presentation.title}
          </div>
        </div>

        {/* 幻灯片主体内容 */}
        <div className="flex-1 bg-white p-8 flex items-center justify-center">
          <div className="max-w-4xl w-full">
            {slide.content.length > 0 ? (
              <div className="space-y-6">
                {slide.content.map((item, index) => (
                  <div 
                    key={index}
                    className="text-center text-4xl md:text-6xl font-bold text-gray-900"
                    style={{ 
                      animation: `slideIn 0.5s ease-out ${index * 0.1}s both` 
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-4xl md:text-6xl font-bold text-gray-900">
                {slide.title}
              </div>
            )}
            
            {slide.imageUrl && (
              <div className="mt-8 text-center">
                <img 
                  src={slide.imageUrl} 
                  alt={slide.title}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* 导航控制栏 */}
        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-t">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentSlide === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            上一页
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              使用手机控制翻页，或按键盘方向键导航
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlide === presentation.slides.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentSlide === presentation.slides.length - 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            下一页
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 键盘快捷键说明 */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}