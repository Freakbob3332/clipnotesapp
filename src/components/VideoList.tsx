import React from 'react';
import {
  FileVideo,
  GripHorizontal,
  Trash2,
  Plus,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { VideoItem, ReviewStatus } from '../types';
import { formatTime, formatFileSize } from '../utils/formatters';
import { setupVideoDrag, setupSpreadsheetRowDrag } from '../utils/dragExport';

interface VideoListProps {
  videos: VideoItem[];
  activeVideoId: string | null;
  onSelectVideo: (id: string) => void;
  onDeleteVideo: (id: string) => void;
  onTriggerFileInput: () => void;
}

export const VideoList: React.FC<VideoListProps> = ({
  videos,
  activeVideoId,
  onSelectVideo,
  onDeleteVideo,
  onTriggerFileInput,
}) => {
  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Approved
          </span>
        );
      case 'needs_changes':
        return (
          <span className="text-[10px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" /> Needs Changes
          </span>
        );
      case 'in_review':
        return <span className="text-[10px] text-amber-400">In Review</span>;
      default:
        return <span className="text-[10px] text-slate-500">Pending</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 select-none">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-200">Video Queue</span>
          <span className="text-[11px] font-mono tabular-nums text-slate-500">
            ({videos.length})
          </span>
        </div>

        <button
          onClick={onTriggerFileInput}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
          title="Import another video file"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Videos List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {videos.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            <p>Queue is empty.</p>
            <p className="text-[11px] text-slate-600 mt-1">Drop video files anywhere to begin.</p>
          </div>
        ) : (
          videos.map((item) => {
            const isActive = item.id === activeVideoId;
            return (
              <div
                key={item.id}
                onClick={() => onSelectVideo(item.id)}
                className={`relative group rounded-lg p-2 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 border-sky-500/50 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Thumbnail / Drag out Handle */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setupVideoDrag(e, item);
                    }}
                    title="Drag video directly to desktop or other app"
                    className="relative w-16 h-11 bg-slate-900 rounded border border-slate-800 shrink-0 overflow-hidden group/thumb cursor-grab active:cursor-grabbing flex items-center justify-center"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileVideo className="w-5 h-5 text-slate-600" />
                    )}

                    {/* Drag indicator overlay on hover */}
                    <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-[1px] opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center text-sky-300 text-[9px] font-medium transition-opacity">
                      <GripHorizontal className="w-3.5 h-3.5" />
                      <span>Drag</span>
                    </div>
                  </div>

                  {/* Metadata and Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-medium truncate ${
                          isActive ? 'text-sky-300' : 'text-slate-200'
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVideo(item.id);
                        }}
                        className="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove clip from queue"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono tabular-nums">
                      <span>{formatTime(item.duration)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatFileSize(item.size)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-800/60">
                      <div>{getStatusBadge(item.status)}</div>
                      {item.comment && (
                        <div
                          className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[100px]"
                          title={item.comment}
                        >
                          <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{item.comment}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="flex items-center gap-1 text-slate-400">
          <GripHorizontal className="w-3 h-3 text-sky-400" />
          <span>All clips are draggable</span>
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Drag thumbnail directly into Premiere, Explorer, or Sheets.
        </p>
      </div>
    </div>
  );
};
