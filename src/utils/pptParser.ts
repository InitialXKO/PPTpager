import PizZip from 'pizzip';
import { Presentation, Slide } from '@/types';
import { generatePresentationId } from './index';

interface SlideContent {
  title: string;
  content: string[];
  notes: string;
}

/**
 * 解析PPTX文件
 */
export async function parsePPTXFile(file: File): Promise<Presentation> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    const slides: Slide[] = [];
    let title = file.name.replace(/\.(pptx?|PPTX?)$/, '');

    // 获取幻灯片文件列表
    const slideFiles: string[] = Object.keys(zip.files).filter((relativePath) =>
      /ppt\/slides\/slide\d+\.xml$/.test(relativePath)
    );

    // 按编号排序
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return numA - numB;
    });

    // 解析每个幻灯片
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideNumber = i + 1;
      
      try {
        const slideFileObj = zip.files[slideFile];
        if (!slideFileObj) continue;
        
        const slideXml = slideFileObj.asText();
        if (!slideXml) continue;

        const slideContent = parseSlideXml(slideXml);
        
        // 尝试获取备注
        const notesFile = slideFile.replace(/slides\/slide(\d+)\.xml/, 'notesSlides/notesSlide$1.xml');
        let notes = slideContent.notes;
        
        try {
          const notesFileObj = zip.files[notesFile];
          if (notesFileObj) {
            const notesXml = notesFileObj.asText();
            if (notesXml) {
              notes = parseNotesXml(notesXml) || notes;
            }
          }
        } catch (e) {
          // 备注文件可能不存在
        }

        slides.push({
          id: slideNumber,
          title: slideContent.title || `幻灯片 ${slideNumber}`,
          notes: notes || `这是第 ${slideNumber} 张幻灯片`,
          content: slideContent.content,
        });
      } catch (error) {
        console.error(`解析幻灯片 ${slideNumber} 失败:`, error);
        // 添加占位幻灯片
        slides.push({
          id: slideNumber,
          title: `幻灯片 ${slideNumber}`,
          notes: `第 ${slideNumber} 张幻灯片`,
          content: [],
        });
      }
    }

    // 如果没有解析到幻灯片，至少添加一个默认幻灯片
    if (slides.length === 0) {
      slides.push({
        id: 1,
        title: title,
        notes: '已加载演示文稿',
        content: [title],
      });
    }

    return {
      id: generatePresentationId(),
      title,
      slides,
      currentSlide: 0,
    };
  } catch (error) {
    console.error('解析PPTX文件失败:', error);
    throw new Error('无法解析PPT文件，请确保文件格式正确');
  }
}

/**
 * 解析幻灯片XML内容
 */
function parseSlideXml(xml: string): SlideContent {
  const content: string[] = [];
  let title = '';

  // 提取所有文本内容
  const textMatches = xml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g);
  const texts: string[] = [];
  
  for (const match of textMatches) {
    const text = match[1].trim();
    if (text) {
      texts.push(text);
    }
  }

  // 第一个文本通常是标题
  if (texts.length > 0) {
    title = texts[0];
    
    // 其余文本作为内容
    for (let i = 1; i < Math.min(texts.length, 10); i++) {
      if (texts[i] && texts[i] !== title) {
        content.push(texts[i]);
      }
    }
  }

  return {
    title: title || '无标题',
    content,
    notes: '',
  };
}

/**
 * 解析备注XML内容
 */
function parseNotesXml(xml: string): string {
  const textMatches = xml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g);
  const texts: string[] = [];
  
  for (const match of textMatches) {
    const text = match[1].trim();
    if (text) {
      texts.push(text);
    }
  }

  return texts.join(' ');
}

/**
 * 验证文件是否为有效的PPT文件
 */
export function isValidPPTFile(file: File): boolean {
  const validExtensions = ['.ppt', '.pptx', '.PPT', '.PPTX'];
  const extension = file.name.substring(file.name.lastIndexOf('.'));
  return validExtensions.includes(extension);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
