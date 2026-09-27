export interface TimestampMarker {
  id: string;
  time: number; // in seconds
  label: string;
  createdAt: number;
}

export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'needs_changes';

export interface VideoItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File | Blob;
  objectUrl: string;
  duration: number;
  width: number;
  height: number;
  thumbnailUrl?: string;
  comment: string;
  timestamps: TimestampMarker[];
  status: ReviewStatus;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export type VideoFitMode = 'contain' | 'cover' | 'original';
