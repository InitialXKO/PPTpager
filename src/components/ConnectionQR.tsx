'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface ConnectionQRProps {
  roomId: string;
  size?: number;
}

export default function ConnectionQR({ roomId, size = 200 }: ConnectionQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return;

      const currentUrl = window.location.href;
      const connectionUrl = `${currentUrl}?room=${roomId}&mode=control`;
      
      try {
        await QRCode.toCanvas(canvasRef.current, connectionUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });
      } catch (error) {
        console.error('生成二维码失败:', error);
      }
    };

    generateQR();
  }, [roomId, size]);

  return (
    <div className="flex flex-col items-center">
      <canvas 
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
      <div className="mt-4 text-center">
        <p className="text-sm font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded border">
          {roomId}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          房间号码
        </p>
      </div>
    </div>
  );
}