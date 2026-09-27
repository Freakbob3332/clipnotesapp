import React from 'react';
import { X, Table, Check, ExternalLink, ArrowRight } from 'lucide-react';

interface SheetsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SheetsHelpModal: React.FC<SheetsHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Table className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Dragging into Google Sheets & Other Programs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Explanation matching image.png */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
            <p className="font-semibold text-emerald-300 mb-1">
              Optimized for Google Sheets Columns A, B & C (Cell C1)
            </p>
            <p className="text-slate-300 text-[11px]">
              When you drag the green <strong className="text-white">"Drag to Spreadsheet"</strong> handle into your Google Sheets window:
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-[10px] text-center">
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Column A</span>
                <span className="text-slate-200">Video Filename</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Column B</span>
                <span className="text-slate-200">Duration (MM:SS)</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 block font-bold">Column C (C1)</span>
                <span className="text-slate-200">Your Comment</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-slate-200">How to drag to different programs:</h4>
            
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Desktop / Explorer / Finder:</strong> Grab the blue <span className="text-sky-300 font-mono">"Drag Video File"</span> handle and drop it into any folder or desktop. It transfers the real video file!
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Premiere / DaVinci Resolve / CapCut / VLC:</strong> Drag the video file badge directly into your media bin, timeline, or player.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Discord / Slack / Teams:</strong> Drag the video badge straight into the message input box to send the file.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Google Sheets / Excel:</strong> Drag the green <span className="text-emerald-300 font-mono">"Drag to Spreadsheet"</span> handle, or use <span className="text-slate-200 font-mono">Copy for Sheet</span> button and hit <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">Ctrl+V</kbd> in cell A1 or C1.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
