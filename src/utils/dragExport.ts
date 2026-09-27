import { VideoItem } from '../types';
import { formatTime } from './formatters';

/**
 * Prepares the dataTransfer object when dragging the video file OUT to another program
 * (Desktop, Explorer, Finder, Video Editors, Slack, Discord, Browser tabs)
 */
export function setupVideoDrag(e: React.DragEvent, video: VideoItem) {
  e.dataTransfer.effectAllowed = 'copyMove';

  const mimeType = video.type || 'video/mp4';
  const fileName = video.name;
  const url = video.objectUrl;

  // 1. Chrome / Chromium DownloadURL protocol (drags directly as a file to Desktop/Folders)
  try {
    e.dataTransfer.setData('DownloadURL', `${mimeType}:${fileName}:${url}`);
  } catch (err) {
    console.debug('DownloadURL dataTransfer not supported', err);
  }

  // 2. Add real File to items if supported by browser during dragstart
  try {
    if (e.dataTransfer.items && video.file && video.file instanceof File) {
      e.dataTransfer.items.add(video.file);
    }
  } catch (err) {
    console.debug('Adding file directly to dataTransfer not permitted', err);
  }

  // 3. Fallbacks for text/uri consumers
  try {
    e.dataTransfer.setData('text/uri-list', url);
  } catch (err) {
    console.debug('URI list not supported', err);
  }

  try {
    e.dataTransfer.setData('text/plain', `${fileName} (${url})`);
  } catch (err) {
    console.debug('Text plain not supported', err);
  }
}

/**
 * Prepares dataTransfer for dragging the comment directly into Google Sheets, Excel, or text docs
 * (Matching the user's screenshot with cell C1 selected!)
 */
export function setupCommentDrag(e: React.DragEvent, video: VideoItem) {
  e.dataTransfer.effectAllowed = 'copy';
  const commentText = video.comment || `Review notes for ${video.name}`;
  
  e.dataTransfer.setData('text/plain', commentText);
  e.dataTransfer.setData('text/html', `<span>${commentText.replace(/\n/g, '<br/>')}</span>`);
}

/**
 * Prepares dataTransfer for dragging the entire record across columns A, B, and C in Google Sheets
 * Column A: Video Name
 * Column B: Duration
 * Column C: Comment
 */
export function setupSpreadsheetRowDrag(e: React.DragEvent, video: VideoItem) {
  e.dataTransfer.effectAllowed = 'copy';
  const durationStr = formatTime(video.duration);
  const cleanComment = (video.comment || '').replace(/\t/g, ' ').replace(/\n/g, ' ');

  // Tab-Separated Values (TSV) - standard for spreadsheets
  const tsv = `${video.name}\t${durationStr}\t${cleanComment}`;
  e.dataTransfer.setData('text/plain', tsv);

  // HTML Table fallback for rich sheet drop
  const html = `<table><tr><td>${escapeHtml(video.name)}</td><td>${durationStr}</td><td>${escapeHtml(cleanComment)}</td></tr></table>`;
  e.dataTransfer.setData('text/html', html);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Copies native file to clipboard if supported by browser
 */
export async function copyFileToClipboard(video: VideoItem): Promise<boolean> {
  if (!video.file) return false;
  try {
    if (navigator.clipboard && 'write' in navigator.clipboard && window.ClipboardItem) {
      // Some browsers require specific image or blob types, but let's try
      const item = new ClipboardItem({
        [video.file.type || 'application/octet-stream']: video.file,
      });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('Direct file clipboard copy failed, falling back to name', err);
  }
  return false;
}

/**
 * Generates and downloads a CSV of all videos and comments
 */
export function exportToCSV(videos: VideoItem[]) {
  const headers = ['Video Name', 'Duration', 'Size', 'Status', 'Timestamp Markers', 'Comment', 'Created At'];
  const rows = videos.map((v) => {
    const markersStr = v.timestamps.map((t) => `[${formatTime(t.time)}] ${t.label}`).join('; ');
    return [
      `"${v.name.replace(/"/g, '""')}"`,
      `"${formatTime(v.duration)}"`,
      `"${(v.size / (1024 * 1024)).toFixed(2)} MB"`,
      `"${v.status}"`,
      `"${markersStr.replace(/"/g, '""')}"`,
      `"${(v.comment || '').replace(/"/g, '""')}"`,
      `"${new Date(v.createdAt).toISOString()}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `video_review_comments_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
