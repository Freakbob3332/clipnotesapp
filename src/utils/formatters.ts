export function formatTime(seconds: number, includeSubseconds = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const minStr = mins.toString().padStart(2, '0');
  const secStr = secs.toString().padStart(2, '0');

  if (includeSubseconds) {
    const millis = Math.floor((seconds % 1) * 100);
    const msStr = millis.toString().padStart(2, '0');
    return `${minStr}:${secStr}.${msStr}`;
  }

  return `${minStr}:${secStr}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function generateThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.currentTime = 0.5;

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        } else {
          resolve('');
        }
      } catch (e) {
        console.warn('Thumbnail generation failed', e);
        resolve('');
      } finally {
        video.removeEventListener('seeked', handleSeeked);
      }
    };

    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', () => resolve(''));
    // Trigger load
    video.load();
  });
}
