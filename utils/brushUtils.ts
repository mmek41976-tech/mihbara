
import { Brush } from '../types';

/**
 * تحويل كائن الفرشاة إلى سلسلة نصية Base64 صالحة للاستخدام في الروابط
 */
export const encodeBrushForLink = (brush: Brush): string => {
  try {
    const json = JSON.stringify(brush);
    return btoa(encodeURIComponent(json));
  } catch (e) {
    console.error('Error encoding brush:', e);
    return '';
  }
};

/**
 * فك تشفير بيانات الفرشاة من سلسلة Base64
 */
export const decodeBrushFromLink = (encoded: string): Brush | null => {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as Brush;
  } catch (e) {
    console.error('Error decoding brush:', e);
    return null;
  }
};

/**
 * تصدير الفرشاة كملف قابل للتحميل
 */
export const exportBrushToFile = (brush: Brush) => {
  const data = JSON.stringify(brush, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${brush.name.replace(/\s+/g, '_')}.brush`;
  link.click();
  URL.revokeObjectURL(url);
};
