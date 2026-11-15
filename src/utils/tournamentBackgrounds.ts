import type { TournamentBackground } from '../types/tournament';

export const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024;
export const defaultBackground = (): TournamentBackground => ({ source: 'default', overlay: 65 });
export type BackgroundDraft = { config: TournamentBackground; file?: File };

export function validateImageUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Chỉ chấp nhận URL ảnh HTTPS không chứa thông tin đăng nhập.');
  if (url.href.length > 4096) throw new Error('URL ảnh quá dài.');
  return url.href;
}

export function validateBackground(config?: TournamentBackground): void {
  if (!config) return;
  if (!Number.isFinite(config.overlay) || config.overlay < 0 || config.overlay > 95) throw new Error('Lớp phủ tối phải từ 0 đến 95%.');
  if (config.source === 'url') validateImageUrl(config.url);
  else if (config.source === 'upload') {
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(config.assetId) || !config.fileName || config.fileName.length > 255) throw new Error('Tham chiếu ảnh tải lên không hợp lệ.');
  } else if (config.source !== 'default' && config.source !== 'none') throw new Error('Nguồn ảnh nền không hợp lệ.');
}

export async function validateImageFile(file: Blob): Promise<void> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chọn ảnh JPG, PNG hoặc WebP.');
  if (file.size === 0 || file.size > MAX_BACKGROUND_BYTES) throw new Error('Ảnh phải có dung lượng từ 1 byte đến 8 MB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!(file.type === 'image/png' && png || file.type === 'image/jpeg' && jpeg || file.type === 'image/webp' && webp)) throw new Error('Nội dung tệp không khớp định dạng ảnh.');
}

export function loadBackgroundImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => { image.src = ''; reject(new Error('Ảnh tải quá lâu. Vui lòng thử URL khác.')); }, 15000);
    image.referrerPolicy = 'no-referrer';
    image.onload = () => {
      clearTimeout(timeout);
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 50000000) reject(new Error('Ảnh không hợp lệ hoặc vượt 50 megapixel.'));
      else resolve();
    };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Không tải được ảnh. Kiểm tra URL hoặc chọn tệp khác.')); };
    image.src = url;
  });
}

// Blobs live in IndexedDB. Tournament JSON stores only the opaque asset ID.
function openImages(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Trình duyệt không hỗ trợ lưu ảnh. Hãy dùng URL HTTPS.')); return; }
    const request = indexedDB.open('poker_cafe_backgrounds', 1);
    let blocked = false;
    request.onupgradeneeded = () => { request.result.createObjectStore('images'); };
    request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result); };
    request.onerror = () => reject(new Error('Không mở được kho ảnh. Hãy dùng URL HTTPS hoặc kiểm tra quyền lưu trữ.'));
    request.onblocked = () => { blocked = true; reject(new Error('Kho ảnh đang bị khóa. Đóng tab cũ và thử lại.')); };
  });
}

export async function saveBackgroundFile(file: File): Promise<string> {
  await validateImageFile(file);
  const db = await openImages();
  const id = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('images', 'readwrite');
      transaction.objectStore('images').put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error('Không lưu được ảnh. Kho lưu trữ có thể đã đầy.'));
    });
    return id;
  } finally { db.close(); }
}

export async function readBackgroundFile(id: string): Promise<Blob | undefined> {
  const db = await openImages();
  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const request = db.transaction('images', 'readonly').objectStore('images').get(id);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : undefined);
      request.onerror = () => reject(new Error('Không đọc được ảnh đã lưu.'));
    });
  } finally { db.close(); }
}

export async function deleteBackgroundFile(id: string): Promise<void> {
  const db = await openImages();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('images', 'readwrite');
      transaction.objectStore('images').delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error('Không xóa được ảnh đã lưu.'));
    });
  } finally { db.close(); }
}
