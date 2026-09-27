import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Camera,
  Repeat,
  GripHorizontal,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileVideo,
} from 'lucide-react';
import { VideoItem, TimestampMarker, VideoFitMode } from '../types';
import { formatTime } from '../utils/formatters';
import { setupVideoDrag } from '../utils/dragExport';

interface VideoPlayerProps {
  video: VideoItem | null;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onAddTimestampMarker: (time: number) => void;
  onDropFiles: (files: FileList | File[]) => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
  onTriggerFileInput: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  currentTime,
  setCurrentTime,
  videoRef,
  onAddTimestampMarker,
  onDropFiles,
  onLoadSample,
  isLoadingSample,
  onTriggerFileInput,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [fitMode, setFitMode] = useState<VideoFitMode>('contain');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sync video duration & reset states on video change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [video?.id]);

  // Spacebar and keyboard shortcuts for player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          stepFrame(-1);
        } else {
          seekRelative(-5);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          stepFrame(1);
        } else {
          seekRelative(5);
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.warn);
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaSeconds));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    // Approx 30fps = 0.0333s per frame
    const frameDuration = 1 / 30;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + frames * frameDuration));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = Math.max(0, Math.min(duration, pos * duration));
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(pos * duration);
    setHoverX(x);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.warn);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.warn);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !video) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    
    // Download snapshot
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${video.name.replace(/\.[^/.]+$/, '')}_frame_${formatTime(currentTime).replace(':', '_')}.png`;
    a.click();
  };

  // Drag-and-drop zone handling for incoming files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  if (!video) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full h-full min-h-[460px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 select-none ${
          isDraggingOver
            ? 'border-sky-500 bg-sky-950/20 scale-[0.99]'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-sky-400 mb-4 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-100 mb-1">
          Drop your video file here
        </h3>
        <p className="text-xs text-slate-400 max-w-sm text-center mb-6">
          Accepts MP4, WebM, MOV, MKV, AVI. Files run 100% locally in your browser with instant playback and zero uploads.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onTriggerFileInput}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Browse Local File
          </button>
          <button
            onClick={onLoadSample}
            disabled={isLoadingSample}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoadingSample ? 'Generating...' : 'Try Demo Video Clip'}
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full min-h-[480px] bg-black rounded-xl overflow-hidden flex flex-col border border-slate-800 group ${
        isDraggingOver ? 'ring-2 ring-sky-500' : ''
      }`}
    >
      {/* Top Banner: Draggable Video Badge */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-xs transition-opacity duration-200 opacity-90 group-hover:opacity-100">
        <div className="flex items-center gap-2 text-slate-300 truncate">
          <FileVideo className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="font-mono text-slate-200 truncate max-w-xs">{video.name}</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {video.width > 0 ? `${video.width}×${video.height}` : ''}
          </span>
        </div>

        {/* The Direct Drag Out Handle */}
        <div
          draggable
          onDragStart={(e) => setupVideoDrag(e, video)}
          title="Click and drag this badge to any other program (Desktop, Premiere, Slack, Discord, Browser tabs)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 cursor-grab active:cursor-grabbing font-medium shadow-sm transition-all hover:scale-[1.02]"
        >
          <GripHorizontal className="w-3.5 h-3.5" />
          <span className="text-[11px] whitespace-nowrap">Drag Video to Program</span>
        </div>
      </div>

      {/* Main Video Surface */}
      <div
        className="relative flex-1 bg-black flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={video.objectUrl}
          loop={isLooping}
          className={`w-full h-full select-none ${
            fitMode === 'contain'
              ? 'object-contain'
              : fitMode === 'cover'
              ? 'object-cover'
              : 'object-none'
          }`}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration || video.duration || 0);
              video.duration = videoRef.current.duration || video.duration || 0;
              video.width = videoRef.current.videoWidth || 0;
              video.height = videoRef.current.videoHeight || 0;
            }
          }}
          onEnded={() => {
            if (!isLooping) setIsPlaying(false);
          }}
          playsInline
        />

        {/* Center Play Overlay Icon when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-slate-900/80 border border-slate-700/80 flex items-center justify-center text-white pl-0.5 shadow-xl backdrop-blur-sm">
              <Play className="w-6 h-6 fill-current" />
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div
        className="relative z-20 bg-slate-950/95 border-t border-slate-800 px-3 py-2 flex flex-col gap-1.5 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Timeline Scrubber */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
          className="relative w-full h-4 flex items-center cursor-pointer group/timeline py-1"
        >
          {/* Background track */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full relative overflow-hidden group-hover/timeline:h-2 transition-all">
            {/* Played progress */}
            <div
              className="h-full bg-sky-500 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Timestamp markers on timeline */}
          {video.timestamps.map((marker) => {
            const left = duration > 0 ? (marker.time / duration) * 100 : 0;
            return (
              <div
                key={marker.id}
                style={{ left: `${left}%` }}
                title={`Marker: ${formatTime(marker.time)} - ${marker.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.currentTime = marker.time;
                    setCurrentTime(marker.time);
                  }
                }}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-3 bg-amber-400 rounded-xs border border-amber-900 z-10 hover:scale-125 transition-transform"
              />
            );
          })}

          {/* Scrubber thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border border-slate-400 opacity-0 group-hover/timeline:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />

          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono tabular-nums text-slate-200 pointer-events-none shadow"
              style={{ left: `${hoverX}px` }}
            >
              {formatTime(hoverTime, true)}
            </div>
          )}
        </div>

        {/* Buttons and controls row */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Frame step backward */}
            <button
              onClick={() => stepFrame(-1)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Previous frame (-1 frame / Shift+Left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Jump -5s */}
            <button
              onClick={() => seekRelative(-5)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Back 5 seconds (Left Arrow)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Jump +5s */}
            <button
              onClick={() => seekRelative(5)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Forward 5 seconds (Right Arrow)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Frame step forward */}
            <button
              onClick={() => stepFrame(1)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Next frame (+1 frame / Shift+Right)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Timecode display */}
            <div className="font-mono tabular-nums text-[11px] text-slate-400 ml-1 sm:ml-2">
              <span className="text-slate-100 font-medium">{formatTime(currentTime, true)}</span>
              <span className="text-slate-600 mx-1">/</span>
              <span>{formatTime(duration, true)}</span>
            </div>
          </div>

          {/* Right: Audio, Speed, Camera, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Speed pills */}
            <div className="hidden sm:flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px] font-mono">
              {[0.5, 1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    playbackRate === rate
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-1 group/vol">
              <button
                onClick={toggleMute}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-12 h-1 bg-slate-800 accent-sky-500 cursor-pointer hidden md:inline-block"
              />
            </div>

            {/* Loop */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isLooping ? 'text-sky-400 bg-sky-950/40' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isLooping ? 'Looping enabled' : 'Enable loop'}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Snapshot */}
            <button
              onClick={captureFrame}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Take frame snapshot (.png)"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* Fit mode */}
            <button
              onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
              className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] uppercase font-mono text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded cursor-pointer"
              title={`Display mode: ${fitMode}`}
            >
              {fitMode}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
