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

    const rooms = new Map<string, Set<string>>();
    const devices = new Map<string, any>();

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_room', (data) => {
        const { roomId, deviceId, data: userData } = data;
        const deviceType = userData?.deviceType ?? 'presenter';
        const deviceName = userData?.deviceName ?? `${deviceType}_${deviceId}`;
        
        console.log(`Device ${deviceId} joining room ${roomId} as ${deviceType}`);
        
        socket.join(roomId);
        
        const device = {
          id: deviceId,
          socketId: socket.id,
          type: deviceType,
          name: deviceName,
          connectedAt: new Date(),
        };
        
        devices.set(deviceId, device);
        
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(deviceId);
        
        const roomDevices = Array.from(rooms.get(roomId)!)
          .map((id) => devices.get(id))
          .filter(Boolean);
        
        io.to(roomId).emit('room_joined', {
          roomId,
          devices: roomDevices,
        });
        
        io.to(roomId).emit('devices_updated', roomDevices);
        
        console.log(`Room ${roomId} now has ${roomDevices.length} devices`);
      });

      socket.on('slide_change', (data) => {
        const { roomId, data: slideData } = data;
        console.log(`Slide change in room ${roomId}:`, slideData);
        
        io.to(roomId).emit('slide_changed', slideData);
      });

      socket.on('load_presentation', (data) => {
        const { roomId, data: presentationData } = data;
        console.log(`Loading presentation in room ${roomId}`);
        
        io.to(roomId).emit('presentation_loaded', presentationData);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        for (const [deviceId, device] of devices.entries()) {
          if (device.socketId === socket.id) {
            devices.delete(deviceId);
            
            for (const [roomId, roomDevices] of rooms.entries()) {
              if (roomDevices.has(deviceId)) {
                roomDevices.delete(deviceId);
                
                const remainingDevices = Array.from(roomDevices)
                  .map((id) => devices.get(id))
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
