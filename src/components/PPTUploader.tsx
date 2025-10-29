'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { parsePPTXFile, isValidPPTFile, formatFileSize } from '@/utils/pptParser';
import { Presentation } from '@/types';

interface PPTUploaderProps {
  onPresentationLoaded: (presentation: Presentation) => void;
  onCancel?: () => void;
}

export default function PPTUploader({ onPresentationLoaded, onCancel }: PPTUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccess(false);

    // 验证文件类型
    if (!isValidPPTFile(file)) {
      setError('请选择有效的PPT文件 (.ppt 或 .pptx)');
      return;
    }

    // 验证文件大小 (最大50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('文件大小不能超过50MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const presentation = await parsePPTXFile(selectedFile);
      setSuccess(true);
      
      // 延迟一下让用户看到成功状态
      setTimeout(() => {
        onPresentationLoaded(presentation);
      }, 500);
    } catch (err: any) {
      setError(err.message || '解析PPT文件失败，请重试');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">上传PPT文件</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 拖放区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".ppt,.pptx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!selectedFile ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">
              拖放PPT文件到这里
            </p>
            <p className="text-sm text-gray-500 mb-4">
              或者
            </p>
            <button
              onClick={handleBrowseClick}
              className="btn-primary"
              disabled={isUploading}
            >
              浏览文件
            </button>
            <p className="text-xs text-gray-400 mt-4">
              支持 .ppt 和 .pptx 格式，最大50MB
            </p>
          </>
        ) : (
          <div className="space-y-4">
            {/* 文件信息 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-8 h-8 text-primary-500 flex-shrink-0 mt-1" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 break-all">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && !success && (
                <button
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 成功状态 */}
            {success && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">解析成功！正在加载...</span>
              </div>
            )}

            {/* 上传按钮 */}
            {!success && (
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    isUploading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      解析中...
                    </span>
                  ) : (
                    '开始解析'
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  重选
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">上传失败</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* 帮助信息 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">使用提示</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 支持 Microsoft PowerPoint 格式 (.pptx)</li>
          <li>• 将自动提取幻灯片标题、内容和备注</li>
          <li>• 复杂格式可能显示为简化版本</li>
          <li>• 图片和动画暂不支持</li>
        </ul>
      </div>
    </div>
  );
}
