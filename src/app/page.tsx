'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateRoomCode, generateDefaultPresentation } from '@/utils';
import { Play, Smartphone, Monitor, ArrowRight, Upload } from 'lucide-react';
import PPTUploader from '@/components/PPTUploader';
import { Presentation } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const startPresentation = async (presentation?: Presentation) => {
    setIsLoading(true);
    try {
      const roomCode = generateRoomCode();
      const sessionData = {
        roomCode,
        presentation: presentation ?? generateDefaultPresentation(),
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem('ppt_session', JSON.stringify(sessionData));
      
      setTimeout(() => {
        router.push(`/present/${roomCode}`);
      }, 600);
    } catch (error) {
      console.error('启动演示失败:', error);
      setIsLoading(false);
    }
  };

  const goToController = () => {
    router.push('/control');
  };

  const handlePresentationLoaded = (presentation: Presentation) => {
    setShowUploader(false);
    startPresentation(presentation);
  };

  const openUploader = () => {
    setShowUploader(true);
  };

  const closeUploader = () => {
    setShowUploader(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            PPT遥控器
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-2">
            演讲者的隐形提词助手
          </p>
          <p className="text-lg text-gray-500">
            手机控制PPT翻页 + 题词提示器
          </p>
        </div>

        {/* Quick Actions */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Start Presentation Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Start with Default Presentation */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <Play className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  快速开始
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  使用示例演示文稿快速开始
                </p>
                <button
                  onClick={() => startPresentation()}
                  disabled={isLoading}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      启动中...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      开始演示
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Upload PPT */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <Upload className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  上传PPT
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  上传您自己的PowerPoint文件
                </p>
                <button
                  onClick={openUploader}
                  disabled={isLoading}
                  className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  选择文件
                </button>
              </div>
            </div>
          </div>

          {/* PPT Uploader */}
          {showUploader && (
            <PPTUploader
              onPresentationLoaded={handlePresentationLoaded}
              onCancel={closeUploader}
            />
          )}

          {/* Controller Button */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center">
              <Smartphone className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                手机控制台
              </h2>
              <p className="text-gray-600 mb-6">
                作为遥控器控制正在进行的PPT演示
              </p>
              <button
                onClick={goToController}
                className="btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                <Smartphone className="w-6 h-6" />
                打开控制台
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
              核心功能
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Monitor className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">一键连接</h3>
                <p className="text-sm text-gray-600">扫码或输入房间号立即配对</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">遥控翻页</h3>
                <p className="text-sm text-gray-600">上一页/下一页/跳转指定页</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Play className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">题词显示</h3>
                <p className="text-sm text-gray-600">手机端显示当前幻灯片备注</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">实时同步</h3>
                <p className="text-sm text-gray-600">PPT页码双向实时更新</p>
              </div>
            </div>
          </div>

          {/* Target Users */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
              适用场景
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="p-4">
                <div className="text-2xl mb-2">💼</div>
                <h3 className="font-medium text-gray-900">企业汇报</h3>
              </div>
              <div className="p-4">
                <div className="text-2xl mb-2">🎓</div>
                <h3 className="font-medium text-gray-900">教育培训</h3>
              </div>
              <div className="p-4">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-medium text-gray-900">演讲比赛</h3>
              </div>
              <div className="p-4">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="font-medium text-gray-900">产品发布</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}