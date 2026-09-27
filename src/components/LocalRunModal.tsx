import React, { useState } from 'react';
import { X, Terminal, Copy, Check, HardDrive, Download, Upload, ShieldCheck } from 'lucide-react';
import { VideoItem } from '../types';

interface LocalRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: VideoItem[];
  onImportData: (data: Partial<VideoItem>[]) => void;
}

export const LocalRunModal: React.FC<LocalRunModalProps> = ({
  isOpen,
  onClose,
  videos,
  onImportData,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const localRunSteps = `git clone <your-repo-or-download-zip>
cd clipnotes-app
npm install
npm run dev`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(localRunSteps);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleExportJSON = () => {
    const exportable = videos.map((v) => ({
      name: v.name,
      duration: v.duration,
      size: v.size,
      type: v.type,
      comment: v.comment,
      timestamps: v.timestamps,
      status: v.status,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));

    const blob = new Blob([JSON.stringify(exportable, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipnotes_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImportData(json);
          onClose();
        }
      } catch (err) {
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Terminal className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Running Locally on Your Computer
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
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sky-950/20 border border-sky-800/30">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sky-200">100% Client-Side & Private</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All video playback, comments, and drag-and-drop operations run entirely inside your local browser via HTML5 Blob & IndexedDB APIs. No video files ever leave your machine.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-slate-200">Option A: Native Desktop App (Electron Window)</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('npm install\nnpm run desktop');
                  setCopiedCmd(true);
                  setTimeout(() => setCopiedCmd(false), 2000);
                }}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto leading-relaxed">
git clone &lt;repo&gt;
cd clipnotes-app
npm install
npm run desktop    # Opens directly in dedicated native Electron desktop window!
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-slate-200">Option B: Instant Desktop App (PWA)</span>
            </div>
            <p className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              Click <strong className="text-white">"Install as App"</strong> in the top-right header or your browser's install icon. It runs in a borderless desktop window with its own taskbar/dock icon and zero browser tabs or URL bars.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <span className="font-medium text-slate-200 block mb-2">Local Data Backup & Transfer:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="flex-1 py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Backup Notes (JSON)</span>
              </button>

              <label className="flex-1 py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
