import { supabase } from './supabaseClient';

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 60;

function validateFile(file: File, kind: 'image' | 'video') {
  const maxBytes = (kind === 'image' ? MAX_IMAGE_MB : MAX_VIDEO_MB) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File too large. Max ${kind === 'image' ? MAX_IMAGE_MB : MAX_VIDEO_MB}MB.`);
  }
  const okType = kind === 'image'
    ? file.type.startsWith('image/')
    : file.type.startsWith('video/');
  if (!okType) throw new Error(`Invalid file type for ${kind}.`);
}

export async function uploadFile(
  bucket: 'avatars' | 'posts' | 'videos' | 'stories',
  file: File,
  kind: 'image' | 'video',
  userId: string
) {
  validateFile(file, kind);

  const ext = file.name.split('.').pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('Could not read video metadata'));
    video.src = URL.createObjectURL(file);
  });
}
