
import React, { useState, useRef, useEffect } from 'react';
import PageHeader from './PageHeader';
import JSZip from 'jszip';

interface VideoToJpgConverterProps {
  onGoHome: () => void;
}

type ExtractMode = 'seconds' | 'total' | 'frames';

interface ExtractedFrame {
  id: string;
  time: number;
  imageUrl: string;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const VideoToJpgConverter: React.FC<VideoToJpgConverterProps> = ({ onGoHome }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  
  const [mode, setMode] = useState<ExtractMode>('seconds');
  const [inputValue, setInputValue] = useState<number>(1);
  const [fps, setFps] = useState<number>(30); // Estimated FPS for frame calculation
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  
  // Use a ref to track cancellation to avoid stale closures in the async loop
  const abortProcessing = useRef(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(url);
      setFrames([]);
      setProgress(0);
      setIsProcessing(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const calculateTimestamps = (): number[] => {
    if (!videoDuration) return [];
    const timestamps: number[] = [];
    
    switch (mode) {
      case 'seconds': {
        // Extract every X seconds
        const intervalSec = Math.max(0.1, inputValue);
        let i = 0;
        while (true) {
            const t = i * intervalSec;
            // Stop if t is exactly or greater than duration
            // Using a small epsilon for float comparison safety if needed, but simple comparison usually works for this
            if (t >= videoDuration) break;
            timestamps.push(t);
            i++;
        }
        break;
      } 
      case 'total': {
        // Extract total X frames distributed evenly
        const count = Math.max(1, Math.round(inputValue));
        if (count === 1) {
            timestamps.push(0);
        } else {
            // Distribute `count` frames. 
            // To capture the last frame at the very end might fail if duration is exact, 
            // so we distribute them such that the last one is slightly before end or at end.
            // Using simple division: 0, step, 2*step... 
            const step = videoDuration / count;
            for (let i = 0; i < count; i++) {
                let t = i * step;
                if (t >= videoDuration) t = videoDuration - 0.01; // Ensure it's within bounds
                timestamps.push(t);
            }
        }
        break;
      }
      case 'frames': {
        // Extract every X frames
        const frameInterval = Math.max(1, inputValue);
        const stepTime = frameInterval / fps;
        let i = 0;
        while (true) {
            const t = i * stepTime;
            if (t >= videoDuration) break;
            timestamps.push(t);
            i++;
        }
        break;
      }
    }
    return timestamps;
  };

  const processVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    abortProcessing.current = false;
    setFrames([]);
    setProgress(0);

    const timestamps = calculateTimestamps();
    
    if (timestamps.length === 0) {
        setIsProcessing(false);
        return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Helper to seek and capture
    const captureAt = (time: number): Promise<ExtractedFrame> => {
      return new Promise((resolve) => {
        const onSeeked = () => {
          // Clean up listener just in case
          video.removeEventListener('seeked', onSeeked);
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageUrl = canvas.toDataURL('image/jpeg', 0.9); // 90% quality JPG
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            time: time,
            imageUrl: imageUrl
          });
        };
        
        video.currentTime = time;
        // Use { once: true } to automatically remove listener, but manual removal in callback is safer if timeout logic is added
        video.addEventListener('seeked', onSeeked, { once: true });
      });
    };

    // Process sequentially
    for (let i = 0; i < timestamps.length; i++) {
      if (abortProcessing.current) break;

      try {
        const frame = await captureAt(timestamps[i]);
        setFrames(prev => [...prev, frame]);
        setProgress(Math.round(((i + 1) / timestamps.length) * 100));
        
        // Small pause to allow UI updates and event loop processing
        await new Promise(r => setTimeout(r, 10));
      } catch (e) {
        console.error("Error capturing frame at", timestamps[i], e);
      }
    }

    setIsProcessing(false);
  };

  const handleStop = () => {
      abortProcessing.current = true;
      setIsProcessing(false);
  };

  const handleDownloadZip = async () => {
    if (frames.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder("frames");

    frames.forEach((frame, index) => {
        const base64Data = frame.imageUrl.split(',')[1];
        const fileName = `frame_${index + 1}_${frame.time.toFixed(2)}s.jpg`;
        folder?.file(fileName, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `video_frames_${videoFile?.name || 'images'}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <PageHeader title="Chuyển đổi Video sang JPG miễn phí" onBack={onGoHome} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Controls */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <h2 className="text-xl font-bold text-heading mb-4">1. Tải Video</h2>
                <div 
                    className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-brand-purple transition-colors bg-gray-900/30"
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    {videoFile ? (
                        <div className="text-center">
                            <p className="text-brand-light-purple font-semibold truncate max-w-[200px] mx-auto">{videoFile.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            {videoDuration > 0 && <p className="text-xs text-gray-400 mt-1">Thời lượng: {videoDuration.toFixed(1)}s</p>}
                        </div>
                    ) : (
                        <>
                            <UploadIcon />
                            <p className="text-dark-text-secondary font-medium">Chọn tệp video</p>
                            <p className="text-xs text-gray-500 mt-1">MP4, MOV, WEBM...</p>
                        </>
                    )}
                </div>

                {/* Hidden Video & Canvas for Processing */}
                <video 
                    ref={videoRef}
                    src={videoUrl || undefined}
                    onLoadedMetadata={handleLoadedMetadata}
                    className="hidden"
                    muted
                    playsInline
                    // Ensure crossOrigin is set if needed, though local files are blob URLs
                />
                <canvas ref={canvasRef} className="hidden" />

                {videoFile && (
                    <div className="mt-6 space-y-4 pt-4 border-t border-dark-border">
                        <h2 className="text-xl font-bold text-heading">2. Cấu hình</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-dark-text-secondary mb-2">Chế độ trích xuất</label>
                            <select 
                                value={mode}
                                onChange={(e) => setMode(e.target.value as ExtractMode)}
                                className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple"
                                disabled={isProcessing}
                            >
                                <option value="seconds">Mỗi X giây (Time interval)</option>
                                <option value="total">Tổng số ảnh (Total frames)</option>
                                <option value="frames">Mỗi X Frame (Frame interval)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                                {mode === 'seconds' ? 'Số giây mỗi lần chụp' : 
                                 mode === 'total' ? 'Tổng số ảnh muốn lấy' : 
                                 'Cách nhau bao nhiêu frame'}
                            </label>
                            <input
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(Math.max(0.1, Number(e.target.value)))}
                                className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple"
                                min="0.1"
                                step={mode === 'seconds' ? 0.5 : 1}
                                disabled={isProcessing}
                            />
                        </div>

                        {mode === 'frames' && (
                            <div>
                                <label className="block text-sm font-medium text-dark-text-secondary mb-2">FPS Video (Ước tính)</label>
                                <input
                                    type="number"
                                    value={fps}
                                    onChange={(e) => setFps(Math.max(1, Number(e.target.value)))}
                                    className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple"
                                    placeholder="VD: 24, 30, 60"
                                    disabled={isProcessing}
                                />
                                <p className="text-xs text-gray-500 mt-1">Dùng để tính toán thời gian chụp chính xác hơn.</p>
                            </div>
                        )}

                        <div className="pt-2">
                            {!isProcessing ? (
                                <button
                                    onClick={processVideo}
                                    className="w-full py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple transition-colors"
                                >
                                    Bắt đầu trích xuất
                                </button>
                            ) : (
                                <button
                                    onClick={handleStop}
                                    className="w-full py-3 px-4 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Dừng lại ({progress}%)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT: Results */}
        <div className="lg:col-span-2">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-heading">Kết quả ({frames.length})</h2>
                {frames.length > 0 && !isProcessing && (
                    <button
                        onClick={handleDownloadZip}
                        className="flex items-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Tải tất cả (.ZIP)
                    </button>
                )}
            </div>

            {frames.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-dark-border rounded-lg bg-dark-card">
                    <p className="text-dark-text-secondary">Hình ảnh trích xuất sẽ xuất hiện ở đây.</p>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[80vh] overflow-y-auto p-2">
                {frames.map((frame) => (
                    <div key={frame.id} className="bg-dark-card p-2 rounded border border-dark-border group relative">
                        <img src={frame.imageUrl} alt={`Frame at ${frame.time}s`} className="w-full h-auto rounded aspect-video object-cover" />
                        <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-400">{frame.time.toFixed(2)}s</span>
                            <a 
                                href={frame.imageUrl} 
                                download={`frame_${frame.time.toFixed(2)}s.jpg`}
                                className="text-brand-light-purple hover:text-white text-xs font-bold"
                            >
                                Tải về
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default VideoToJpgConverter;
