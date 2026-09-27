import React, { useState } from 'react';
import {
  GripHorizontal,
  Clock,
  Plus,
  Trash2,
  Copy,
  Check,
  Table,
  FileVideo,
  Download,
  Share2,
  Sparkles,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { VideoItem, TimestampMarker, ReviewStatus } from '../types';
import { formatTime, formatFileSize } from '../utils/formatters';
import {
  setupVideoDrag,
  setupCommentDrag,
  setupSpreadsheetRowDrag,
  copyFileToClipboard,
} from '../utils/dragExport';

interface AnnotationPanelProps {
  video: VideoItem | null;
  currentTime: number;
  onUpdateComment: (comment: string) => void;
  onUpdateStatus: (status: ReviewStatus) => void;
  onUpdateTitle: (name: string) => void;
  onAddTimestampMarker: (time: number, label: string) => void;
  onDeleteTimestampMarker: (markerId: string) => void;
  onSeekToTime: (time: number) => void;
  onOpenSheetsModal: () => void;
}

export const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  video,
  currentTime,
  onUpdateComment,
  onUpdateStatus,
  onUpdateTitle,
  onAddTimestampMarker,
  onDeleteTimestampMarker,
  onSeekToTime,
  onOpenSheetsModal,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [newMarkerLabel, setNewMarkerLabel] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  if (!video) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/30 rounded-xl border border-slate-800 text-slate-500">
        <FileVideo className="w-10 h-10 mb-3 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">No Video Selected</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Drag and drop a video into the player on the left to start annotating and exporting.
        </p>
      </div>
    );
  }

  const handleCopy = async (type: 'comment' | 'row' | 'file') => {
    if (type === 'comment') {
      await navigator.clipboard.writeText(video.comment || '');
      setCopiedType('comment');
    } else if (type === 'row') {
      const tsv = `${video.name}\t${formatTime(video.duration)}\t${(video.comment || '').replace(/\n/g, ' ')}`;
      await navigator.clipboard.writeText(tsv);
      setCopiedType('row');
    } else if (type === 'file') {
      const ok = await copyFileToClipboard(video);
      setCopiedType(ok ? 'file' : 'file-fallback');
    }
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleInsertCurrentTimecode = () => {
    const timecode = `[${formatTime(currentTime)}] `;
    onUpdateComment((video.comment ? video.comment + '\n' : '') + timecode);
  };

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newMarkerLabel.trim() || `Marker at ${formatTime(currentTime)}`;
    onAddTimestampMarker(currentTime, label);
    setNewMarkerLabel('');
  };

  const quickTags = [
    'Need audio balance',
    'Color grade fix',
    'Cut here',
    'Good take',
    'Approved',
  ];

  const handleInsertTag = (tag: string) => {
    const textToAdd = `[${formatTime(currentTime)}] ${tag}\n`;
    onUpdateComment((video.comment ? video.comment + '\n' : '') + textToAdd);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = video.objectUrl;
    a.download = video.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const statusOptions: { value: ReviewStatus; label: string; dotColor: string }[] = [
    { value: 'in_review', label: 'In Review', dotColor: 'bg-amber-400' },
    { value: 'approved', label: 'Approved', dotColor: 'bg-emerald-400' },
    { value: 'needs_changes', label: 'Needs Changes', dotColor: 'bg-rose-400' },
    { value: 'pending', label: 'Pending', dotColor: 'bg-slate-400' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
      {/* Video Metadata Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="w-full text-sm font-medium bg-slate-800 border border-sky-500 rounded px-2 py-1 text-slate-100 focus:outline-none"
                  autoFocus
                  onBlur={() => {
                    if (titleDraft.trim()) onUpdateTitle(titleDraft.trim());
                    setIsEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (titleDraft.trim()) onUpdateTitle(titleDraft.trim());
                      setIsEditingTitle(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                    }
                  }}
                />
              </div>
            ) : (
              <h2
                onClick={() => {
                  setTitleDraft(video.name);
                  setIsEditingTitle(true);
                }}
                title="Click to rename"
                className="text-sm font-semibold text-slate-100 truncate cursor-pointer hover:text-sky-300 transition-colors"
              >
                {video.name}
              </h2>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono tabular-nums">
              <span>{formatTime(video.duration)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatFileSize(video.size)}</span>
              {video.width > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{video.width}×{video.height}</span>
                </>
              )}
            </div>
          </div>

          {/* Status selector */}
          <div className="shrink-0">
            <select
              value={video.status}
              onChange={(e) => onUpdateStatus(e.target.value as ReviewStatus)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DRAG-AND-DROP EXPORT DOCK */}
      <div className="p-3.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Drag Out Station (To Other Programs)
          </span>
          <button
            onClick={onOpenSheetsModal}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Table className="w-3 h-3" />
            <span>Sheets Help</span>
          </button>
        </div>

        {/* The Drag Handles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* 1. Drag Video File */}
          <div
            draggable
            onDragStart={(e) => setupVideoDrag(e, video)}
            className="group relative flex items-center justify-between p-2.5 rounded-lg bg-sky-950/30 hover:bg-sky-900/40 border border-sky-500/30 hover:border-sky-400/60 cursor-grab active:cursor-grabbing transition-all select-none shadow-sm"
            title="Drag directly to Desktop, File Explorer, Premiere Pro, VLC, Discord, Slack or browser tabs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-sky-500/20 text-sky-400">
                <FileVideo className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-sky-200 leading-tight">
                  Drag Video File
                </div>
                <div className="text-[10px] text-sky-300/70">
                  To Desktop / Premiere / Apps
                </div>
              </div>
            </div>
            <GripHorizontal className="w-4 h-4 text-sky-400/70 group-hover:text-sky-300" />
          </div>

          {/* 2. Drag into Google Sheets (Cell C1 / Row) */}
          <div
            draggable
            onDragStart={(e) => setupSpreadsheetRowDrag(e, video)}
            className="group relative flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 hover:border-emerald-400/60 cursor-grab active:cursor-grabbing transition-all select-none shadow-sm"
            title="Drag into Google Sheets or Excel (Populates Column A: Video, B: Time, C: Comment!)"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <Table className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-emerald-200 leading-tight">
                  Drag to Spreadsheet
                </div>
                <div className="text-[10px] text-emerald-300/70">
                  Fills Cols A, B & C1
                </div>
              </div>
            </div>
            <GripHorizontal className="w-4 h-4 text-emerald-400/70 group-hover:text-emerald-300" />
          </div>
        </div>

        {/* Quick Action Copy / Download Toolbar */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => handleCopy('comment')}
            className="flex-1 py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Copy comment text to clipboard"
          >
            {copiedType === 'comment' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedType === 'comment' ? 'Copied Note' : 'Copy Note'}</span>
          </button>

          <button
            onClick={() => handleCopy('row')}
            className="flex-1 py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Copy TSV row (paste into Google Sheet cell A1 or C1)"
          >
            {copiedType === 'row' ? <Check className="w-3 h-3 text-emerald-400" /> : <Table className="w-3 h-3" />}
            <span>{copiedType === 'row' ? 'Copied Row' : 'Copy for Sheet'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-1 px-2.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Download video file locally"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Main Comment / Review Notes Section */}
      <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span>Video Review Comments</span>
            <span className="text-[10px] text-slate-500 font-normal">(Auto-saved locally)</span>
          </label>

          <button
            onClick={handleInsertCurrentTimecode}
            className="text-[11px] font-mono tabular-nums text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/60 px-2 py-0.5 rounded cursor-pointer transition-colors"
            title="Insert timestamp at current playhead"
          >
            <Clock className="w-3 h-3" />
            <span>+ Timestamp [{formatTime(currentTime)}]</span>
          </button>
        </div>

        {/* The Comment Textarea */}
        <div className="relative flex-1 flex flex-col min-h-[140px]">
          <textarea
            value={video.comment}
            onChange={(e) => onUpdateComment(e.target.value)}
            placeholder="Write your review notes, feedback, or edits here...
Tip: Click '+ Timestamp' to insert precise timecode, or click quick tags below."
            className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/80 resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-mono text-slate-500 mr-1 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" /> Quick Tag:
          </span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleInsertTag(tag)}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            >
              + {tag}
            </button>
          ))}
        </div>

        {/* Timestamp Cue Points / Markers */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <span>Timestamp Markers</span>
              <span className="text-[10px] text-slate-500 font-mono">({video.timestamps.length})</span>
            </span>
          </div>

          {/* Add marker form */}
          <form onSubmit={handleAddMarker} className="flex items-center gap-1.5 mb-2.5">
            <div className="px-2 py-1 bg-slate-800 rounded text-[11px] font-mono tabular-nums text-amber-300 border border-slate-700 shrink-0">
              {formatTime(currentTime)}
            </div>
            <input
              type="text"
              value={newMarkerLabel}
              onChange={(e) => setNewMarkerLabel(e.target.value)}
              placeholder="Marker note (e.g. Cut clip here, Audio dip)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer transition-colors"
              title="Add marker at current time"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Markers list */}
          {video.timestamps.length === 0 ? (
            <p className="text-[11px] text-slate-600 italic">No markers added yet. Add key moments during playback.</p>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {video.timestamps
                .sort((a, b) => a.time - b.time)
                .map((marker) => (
                  <div
                    key={marker.id}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 text-xs group/item transition-colors"
                  >
                    <button
                      onClick={() => onSeekToTime(marker.time)}
                      className="flex items-center gap-2 text-left truncate cursor-pointer hover:text-sky-300"
                      title="Jump video to this timestamp"
                    >
                      <span className="font-mono tabular-nums text-[11px] text-amber-400 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-900/60 shrink-0">
                        {formatTime(marker.time)}
                      </span>
                      <span className="text-slate-300 truncate max-w-[200px] text-[11px]">
                        {marker.label}
                      </span>
                    </button>

                    <button
                      onClick={() => onDeleteTimestampMarker(marker.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 rounded opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                      title="Remove marker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
