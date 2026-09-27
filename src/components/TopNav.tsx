import React from 'react';
import { Film, Upload, Download, Terminal, Plus, Sparkles, Table, Monitor } from 'lucide-react';
import { VideoItem } from '../types';
import { exportToCSV } from '../utils/dragExport';
import { PWAInstallButton } from './PWAInstallButton';

interface TopNavProps {
  videos: VideoItem[];
  activeVideo: VideoItem | null;
  onOpenLocalModal: () => void;
  onOpenSheetsModal: () => void;
  onTriggerFileInput: () => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  videos,
  activeVideo,
  onOpenLocalModal,
  onOpenSheetsModal,
  onTriggerFileInput,
  onLoadSample,
  isLoadingSample,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950 px-3 md:px-5 flex items-center justify-between shrink-0 select-none">
      {/* Zone 1: Single Wordmark & Native App Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-xs">
            <Film className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-100 tracking-tight text-sm md:text-base leading-tight">
                ClipNotes
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                APP
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              Local Video Review & Export Studio
            </span>
          </div>
        </div>

        {/* Quiet breadcrumb metadata */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 ml-3 pl-3 border-l border-slate-800">
          <span className="font-mono tabular-nums">{videos.length} {videos.length === 1 ? 'clip' : 'clips'}</span>
          {activeVideo && (
            <>
              <span aria-hidden="true">·</span>
              <span className="max-w-[180px] truncate text-slate-300 font-mono text-[11px]">{activeVideo.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Informational / Navigation */}
      <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
        <button
          onClick={onOpenSheetsModal}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Table className="w-3.5 h-3.5 text-emerald-400" />
          <span>Spreadsheet Sync (Cols A-C)</span>
        </button>
        <button
          onClick={onOpenLocalModal}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span>Desktop & Offline Runner</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions + PWA Install Desktop Button */}
      <div className="flex items-center gap-2">
        {/* Install as Native App CTA Button */}
        <PWAInstallButton onOpenDesktopModal={onOpenLocalModal} />

        {videos.length === 0 && (
          <button
            onClick={onLoadSample}
            disabled={isLoadingSample}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            title="Generate a synthetic video in-browser to test right away"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isLoadingSample ? 'Generating...' : 'Try Demo Clip'}</span>
          </button>
        )}

        {videos.length > 0 && (
          <button
            onClick={() => exportToCSV(videos)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
            title="Download CSV report with all comments and timestamps"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Export CSV</span>
          </button>
        )}

        <button
          onClick={onTriggerFileInput}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Import Video</span>
        </button>
      </div>
    </header>
  );
};
