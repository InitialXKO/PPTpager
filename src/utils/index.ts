// 生成房间代码
export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// 生成演示文稿ID
export const generatePresentationId = (): string => {
  return 'ppt_' + Math.random().toString(36).substring(2, 15);
};

// 检测是否为移动设备
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 检测是否为iOS设备
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// 格式化时间
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 验证房间代码格式
export const isValidRoomCode = (code: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(code);
};

// 生成设备名称
export const generateDeviceName = (type: 'presenter' | 'controller'): string => {
  const deviceTypes = {
    presenter: ['演示主机', '演讲电脑', '主控端'],
    controller: ['手机控制', '遥控器', '移动端'],
  };
  
  const names = deviceTypes[type];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomNum = Math.floor(Math.random() * 999) + 1;
  
  return `${randomName}${randomNum}`;
};

// 本地存储工具
export const storage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      } catch (error) {
        console.warn('Failed to save to localStorage', error);
        reject(error);
      }
    });
  },
  
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('Failed to remove from localStorage');
    }
  },
};

// 生成默认演示文稿
export const generateDefaultPresentation = () => {
  return {
    id: generatePresentationId(),
    title: '示例演示文稿',
    slides: [
      {
        id: 1,
        title: '欢迎使用PPT遥控器',
        notes: '欢迎大家参加今天的演示！使用手机扫描二维码即可开始控制。',
        content: ['欢迎使用PPT遥控器', '扫描二维码开始演示'],
      },
      {
        id: 2,
        title: '产品特性',
        notes: '这里介绍产品的核心特性和优势亮点。',
        content: ['一键连接', '手机遥控', '实时同步', '题词显示'],
      },
      {
        id: 3,
        title: '技术架构',
        notes: '技术栈包括Next.js、PWA、WebSocket等现代技术。',
        content: ['Next.js + TypeScript', 'PWA支持', 'WebSocket通信', '响应式设计'],
      },
      {
        id: 4,
        title: '使用场景',
        notes: '适用于企业汇报、培训教学、演讲比赛等多种场景。',
        content: ['企业汇报', '教育培训', '演讲比赛', '产品发布'],
      },
      {
        id: 5,
        title: '谢谢观看',
        notes: '感谢大家的聆听！如有疑问欢迎随时联系。',
        content: ['感谢聆听', '欢迎反馈', '持续改进'],
      },
    ],
    currentSlide: 0,
  };
};