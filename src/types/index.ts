export interface Slide {
  id: number;
  title: string;
  notes: string;
  imageUrl?: string;
  content: string[];
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  currentSlide: number;
}

export interface Room {
  id: string;
  presentation?: Presentation;
  connectedDevices: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ControlMessage {
  type: 'join' | 'slide_change' | 'notes_update' | 'presentation_load' | 'disconnect';
  roomId: string;
  deviceId: string;
  data?: any;
  timestamp: number;
}

export interface SlideChangeMessage extends ControlMessage {
  type: 'slide_change';
  data: {
    slideNumber: number;
    direction: 'next' | 'prev' | 'goto';
  };
}

export interface PresentationLoadMessage extends ControlMessage {
  type: 'presentation_load';
  data: {
    presentation: Presentation;
  };
}

export interface JoinMessage extends ControlMessage {
  type: 'join';
  data: {
    deviceType: 'presenter' | 'controller';
    deviceName: string;
  };
}

export interface Device {
  id: string;
  name: string;
  type: 'presenter' | 'controller';
  isConnected: boolean;
  lastSeen: Date;
}

export interface ConnectionState {
  isConnected: boolean;
  roomId: string | null;
  deviceId: string;
  deviceType: 'presenter' | 'controller';
  devices: Device[];
}