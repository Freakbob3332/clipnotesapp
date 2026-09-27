import React, { useState } from 'react';
import { Download, Monitor, CheckCircle2, Laptop, Info, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenDesktopModal: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenDesktopModal }) => {
  const { isInstallable, isInstalled, isStandalone, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running in standalone native app window
  if (isStandalone) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-medium text-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Desktop App Mode</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-md transition-all shadow-sm cursor-pointer hover:shadow-sky-500/20 hover:scale-[1.02] border border-sky-400/30"
        title="Install ClipNotes as a dedicated standalone desktop app (no browser tabs/bars)"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Install as App</span>
      </button>

      {/* Manual / Browser Install Guide Dialog */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Run as a Native Desktop App
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <p className="text-slate-300">
                You can run this directly as a <strong className="text-white">standalone app</strong> on your computer (without the browser URL bar or website look):
              </p>

              {/* Option 1: Browser App Install */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-300 font-semibold">
                  <Download className="w-4 h-4" />
                  <span>1. Install to Desktop / Taskbar</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  In Chrome, Edge, or Brave: Click the <strong className="text-slate-200">Install icon</strong> (computer with down arrow) on the right side of your browser URL bar, or click your browser's menu <span className="font-mono text-slate-200">(...)</span> → <strong className="text-slate-200">"Save and share"</strong> → <strong className="text-slate-200">"Install ClipNotes as app"</strong>.
                </p>
                <p className="text-[11px] text-emerald-400">
                  ✓ Creates a desktop icon, pins to Taskbar/Dock, and opens in its own clean window.
                </p>
              </div>

              {/* Option 2: Run 100% Offline / Local */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Laptop className="w-4 h-4" />
                  <span>2. Run Completely Locally via Terminal</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Download or clone this project and run with your favorite runtime or Electron wrapper.
                </p>
                <button
                  onClick={() => {
                    setShowGuide(false);
                    onOpenDesktopModal();
                  }}
                  className="text-[11px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  View offline commands & Electron setup →
                </button>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
