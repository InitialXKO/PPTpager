import { NextRequest, NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import { Server as SocketIOServer } from 'socket.io';

interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface SocketNextResponse extends NextResponse {
  socket: SocketWithIO;
}

export async function GET(req: NextRequest) {
  const res: SocketNextResponse = NextResponse.next() as SocketNextResponse;
  
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // 房间管理
    const rooms = new Map<string, Set<string>>();
    const devices = new Map<string, any>();

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // 加入房间
      socket.on('join_room', (data) => {
        const { roomId, deviceId, deviceType, deviceName } = data;
        
        console.log(`Device ${deviceId} joining room ${roomId}`);
        
        // 加入房间
        socket.join(roomId);
        
        // 记录设备
        const device = {
          id: deviceId,
          socketId: socket.id,
          type: deviceType,
          name: deviceName,
          connectedAt: new Date(),
        };
        
        devices.set(deviceId, device);
        
        // 管理房间成员
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(deviceId);
        
        // 通知房间内所有设备
        const roomDevices = Array.from(rooms.get(roomId)!)
          .map(id => devices.get(id))
          .filter(Boolean);
        
        io.to(roomId).emit('room_joined', { 
          roomId, 
          devices: roomDevices 
        });
        
        io.to(roomId).emit('devices_updated', roomDevices);
        
        console.log(`Room ${roomId} now has ${roomDevices.length} devices`);
      });

      // 幻灯片变化
      socket.on('slide_change', (data) => {
        const { roomId, deviceId, data: slideData } = data;
        console.log(`Slide change in room ${roomId}:`, slideData);
        
        // 广播到房间内所有其他设备
        socket.to(roomId).emit('slide_changed', slideData);
      });

      // 加载演示文稿
      socket.on('load_presentation', (data) => {
        const { roomId, data: presentationData } = data;
        console.log(`Loading presentation in room ${roomId}`);
        
        // 广播到房间内所有设备
        io.to(roomId).emit('presentation_loaded', presentationData);
      });

      // 处理断开连接
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // 清理设备记录
        for (const [deviceId, device] of devices.entries()) {
          if (device.socketId === socket.id) {
            devices.delete(deviceId);
            
            // 从所有房间中移除
            for (const [roomId, roomDevices] of rooms.entries()) {
              if (roomDevices.has(deviceId)) {
                roomDevices.delete(deviceId);
                
                // 通知房间内设备更新
                const remainingDevices = Array.from(roomDevices)
                  .map(id => devices.get(id))
                  .filter(Boolean);
                
                io.to(roomId).emit('devices_updated', remainingDevices);
              }
            }
          }
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.io server already running');
  }
  
  return res;
}

export const config = {
  api: {
    bodyParser: false,
  },
};