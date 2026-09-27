/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { VideoPlayer } from './components/VideoPlayer';
import { AnnotationPanel } from './components/AnnotationPanel';
import { VideoList } from './components/VideoList';
import { SheetsHelpModal } from './components/SheetsHelpModal';
import { LocalRunModal } from './components/LocalRunModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { VideoItem, ReviewStatus } from './types';
import {
  saveVideoToDB,
  getAllVideosFromDB,
  deleteVideoFromDB,
} from './utils/storage';
import { generateThumbnail } from './utils/formatters';
import { generateSampleVideo } from './utils/sampleVideo';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved videos from local IndexedDB on initial mount
  useEffect(() => {
    getAllVideosFromDB().then((savedVideos) => {
      if (savedVideos && savedVideos.length > 0) {
        setVideos(savedVideos);
        setActiveVideoId(savedVideos[0].id);
      }
    });
  }, []);

  const activeVideo = videos.find((v) => v.id === activeVideoId) || null;

  // Process incoming video files (from file drop or file picker)
  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => {
      const type = f.type.toLowerCase();
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      return (
        type.startsWith('video/') ||
        ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v', '.ogv'].includes(ext)
      );
    });

    if (files.length === 0) return;

    const newVideos: VideoItem[] = [];

    for (const file of files) {
      const objectUrl = URL.createObjectURL(file);
      const thumbnail = await generateThumbnail(objectUrl);

      const item: VideoItem = {
        id: 'vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: file.name,
        size: file.size,
        type: file.type || 'video/mp4',
        file,
        objectUrl,
        duration: 0,
        width: 0,
        height: 0,
        thumbnailUrl: thumbnail,
        comment: '',
        timestamps: [],
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      newVideos.push(item);
      saveVideoToDB(item).catch(console.warn);
    }

    setVideos((prev) => {
      const updated = [...prev, ...newVideos];
      return updated;
    });

    if (newVideos.length > 0) {
      setActiveVideoId(newVideos[0].id);
    }
  }, []);

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const sampleFile = await generateSampleVideo();
      await processFiles([sampleFile]);
    } catch (err) {
      console.error('Failed to generate sample video:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset so same file can be re-selected if needed
    e.target.value = '';
  };

  // Drag and drop directly onto window
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [processFiles]);

  // Video updates handlers
  const updateActiveVideo = (patch: Partial<VideoItem>) => {
    if (!activeVideoId) return;
    setVideos((prev) =>
      prev.map((item) => {
        if (item.id === activeVideoId) {
          const updated = { ...item, ...patch, updatedAt: Date.now() };
          saveVideoToDB(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
  };

  const handleUpdateComment = (comment: string) => {
    updateActiveVideo({ comment });
  };

  const handleUpdateStatus = (status: ReviewStatus) => {
    updateActiveVideo({ status });
  };

  const handleUpdateTitle = (name: string) => {
    updateActiveVideo({ name });
  };

  const handleAddTimestampMarker = (time: number, label: string) => {
    if (!activeVideo) return;
    const newMarker = {
      id: 'marker_' + Date.now(),
      time,
      label,
      createdAt: Date.now(),
    };
    const updatedMarkers = [...activeVideo.timestamps, newMarker];
    updateActiveVideo({ timestamps: updatedMarkers });
  };

  const handleDeleteTimestampMarker = (markerId: string) => {
    if (!activeVideo) return;
    const updatedMarkers = activeVideo.timestamps.filter((m) => m.id !== markerId);
    updateActiveVideo({ timestamps: updatedMarkers });
  };

  const handleSeekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    await deleteVideoFromDB(id);
    setVideos((prev) => {
      const filtered = prev.filter((v) => v.id !== id);
      if (activeVideoId === id) {
        setActiveVideoId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleImportData = (data: Partial<VideoItem>[]) => {
    // Merge imported JSON comments with matching names if available
    setVideos((prev) =>
      prev.map((v) => {
        const match = data.find((d) => d.name === v.name);
        if (match) {
          const updated = {
            ...v,
            comment: match.comment || v.comment,
            timestamps: match.timestamps || v.timestamps,
            status: match.status || v.status,
            updatedAt: Date.now(),
          };
          saveVideoToDB(updated).catch(console.warn);
          return updated;
        }
        return v;
      })
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Bar Contract (3 zones) */}
      <TopNav
        videos={videos}
        activeVideo={activeVideo}
        onOpenLocalModal={() => setIsLocalModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onTriggerFileInput={handleTriggerFileInput}
        onLoadSample={handleLoadSample}
        isLoadingSample={isLoadingSample}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Toggle Sidebar Button for small screens */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute bottom-4 left-4 z-30 p-2 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white shadow-lg cursor-pointer md:hidden"
          title="Toggle video list"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        {/* Left Sidebar: Video Queue */}
        <aside
          className={`${
            isSidebarOpen ? 'w-64 md:w-72' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'
          } shrink-0 transition-all duration-200 overflow-hidden z-20 h-full`}
        >
          <div className="w-64 md:w-72 h-full">
            <VideoList
              videos={videos}
              activeVideoId={activeVideoId}
              onSelectVideo={(id) => setActiveVideoId(id)}
              onDeleteVideo={handleDeleteVideo}
              onTriggerFileInput={handleTriggerFileInput}
            />
          </div>
        </aside>

        {/* Main Content Area: Video Player + Annotation Panel Side-by-Side */}
        <main className="flex-1 flex flex-col lg:flex-row min-w-0 p-3 sm:p-4 gap-3 sm:gap-4 overflow-y-auto lg:overflow-hidden bg-slate-950">
          {/* Center Column: Video Player Viewport */}
          <section className="flex-1 flex flex-col min-w-0 min-h-[380px] lg:min-h-0">
            <VideoPlayer
              video={activeVideo}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              videoRef={videoRef}
              onAddTimestampMarker={(time) => handleAddTimestampMarker(time, 'Marker')}
              onDropFiles={processFiles}
              onLoadSample={handleLoadSample}
              isLoadingSample={isLoadingSample}
              onTriggerFileInput={handleTriggerFileInput}
            />
          </section>

          {/* Right Column: Annotation & Drag-Out Panel */}
          <section className="w-full lg:w-[440px] xl:w-[480px] shrink-0 min-h-[440px] lg:min-h-0 flex flex-col">
            <AnnotationPanel
              video={activeVideo}
              currentTime={currentTime}
              onUpdateComment={handleUpdateComment}
              onUpdateStatus={handleUpdateStatus}
              onUpdateTitle={handleUpdateTitle}
              onAddTimestampMarker={handleAddTimestampMarker}
              onDeleteTimestampMarker={handleDeleteTimestampMarker}
              onSeekToTime={handleSeekToTime}
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            />
          </section>
        </main>
      </div>

      {/* Informational Modals */}
      <SheetsHelpModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      <LocalRunModal
        isOpen={isLocalModalOpen}
        onClose={() => setIsLocalModalOpen(false)}
        videos={videos}
        onImportData={handleImportData}
      />

      <OfflineIndicator />
    </div>
  );
}
