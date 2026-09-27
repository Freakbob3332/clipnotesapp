/**
 * Generates a lightweight synthetic test video in WebM format directly in the browser
 * using HTML5 Canvas & MediaRecorder.
 */
export async function generateSampleVideo(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  // Try standard mime types supported by MediaRecorder in Chromium / Firefox / Safari
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }
  }

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType || 'video/webm' }));
    };
  });

  recorder.start();

  const totalFrames = 120; // 4 seconds at 30fps
  let frame = 0;

  return new Promise((resolveFinal) => {
    const draw = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        recordingPromise.then((blob) => {
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const file = new File([blob], `demo_sample_take_01.${extension}`, { type: blob.type });
          resolveFinal(file);
        });
        return;
      }

      const progress = frame / totalFrames;
      const seconds = (frame / 30).toFixed(2);

      // Background
      const grad = ctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);

      // Grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 360);
        ctx.stroke();
      }
      for (let y = 0; y < 360; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // Animated orbit circle
      const angle = progress * Math.PI * 4;
      const cx = 320 + Math.cos(angle) * 120;
      const cy = 180 + Math.sin(angle) * 60;

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Audio waveform simulation
      ctx.fillStyle = '#818cf8';
      for (let i = 0; i < 24; i++) {
        const barHeight = Math.abs(Math.sin(frame * 0.2 + i * 0.5)) * 50 + 8;
        ctx.fillRect(200 + i * 10, 260 - barHeight / 2, 6, barHeight);
      }

      // Title & Timecode
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SAMPLE CLIP #1 [${seconds}s]`, 320, 80);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Drag into another app or spreadsheet · Frame ' + frame + ' / ' + totalFrames, 320, 115);

      // Progress bar at bottom
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, 352, 640 * progress, 8);

      frame++;
      setTimeout(draw, 1000 / 30);
    };

    draw();
  });
}
