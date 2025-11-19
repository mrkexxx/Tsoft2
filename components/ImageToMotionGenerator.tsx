
import React, { useState, useRef } from 'react';
import PageHeader from './PageHeader';
import { generateMotionPromptForImage } from '../services/geminiService';

interface ImageToMotionGeneratorProps {
  onGoHome: () => void;
}

interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  prompt?: string;
  error?: string;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const CopyIcon: React.FC<{ isCopied: boolean }> = ({ isCopied }) => (
    isCopied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    )
);

const ImageToMotionGenerator: React.FC<ImageToMotionGeneratorProps> = ({ onGoHome }) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: ProcessedImage[] = Array.from(files).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending'
      }));
      setImages(prev => [...prev, ...newImages]);
    }
    // Reset input value to allow selecting the same file again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleGeneratePrompts = async () => {
    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error');
    if (pendingImages.length === 0) return;

    setIsProcessing(true);
    let processedCount = 0;

    // Process sequentially to avoid rate limits, or use Promise.all with concurrency limit if needed.
    // For simplicity and better UX feedback, we'll process one by one.
    for (const image of pendingImages) {
      // Logic: Pause 10 seconds after every 5 images
      if (processedCount > 0 && processedCount % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10000ms = 10s
      }

      // Update status to processing
      setImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'processing' } : img));

      try {
        const prompt = await generateMotionPromptForImage(image.file);
        setImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'completed', prompt } : img));
      } catch (error) {
        setImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'error', error: 'Lỗi khi tạo prompt' } : img));
      }
      
      processedCount++;
    }

    setIsProcessing(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
        const filtered = prev.filter(img => img.id !== id);
        // Revoke object URL to avoid memory leaks
        const removed = prev.find(img => img.id === id);
        if (removed) URL.revokeObjectURL(removed.previewUrl);
        return filtered;
    });
  };

  const handleDownloadAll = () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.prompt);
    if (completedImages.length === 0) return;

    // Format: "Prompt (filename): [prompt content]"
    const content = completedImages
        .map(img => {
             const promptText = (img.prompt || '').replace(/(\r\n|\n|\r)/gm, " ").trim();
             return `Prompt (${img.file.name}): ${promptText}`;
        })
        .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'motion_prompts.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
    
  const handleClearAll = () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <PageHeader title="Tạo Prompt Chuyển Động Hàng Loạt" onBack={onGoHome} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-dark-card p-6 rounded-lg border border-dark-border sticky top-4">
            <h2 className="text-xl font-bold text-heading mb-4">1. Tải ảnh lên</h2>
            <div 
                className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-brand-purple transition-colors bg-gray-900/30"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                />
                <UploadIcon />
                <p className="text-dark-text-secondary font-medium">Nhấn để chọn ảnh</p>
                <p className="text-xs text-gray-500 mt-1">Hỗ trợ tải nhiều ảnh cùng lúc</p>
            </div>

            <div className="mt-6 space-y-3">
                <button
                    onClick={handleGeneratePrompts}
                    disabled={isProcessing || images.length === 0}
                    className="w-full py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý...
                        </>
                    ) : (
                        'Tạo Prompt Chuyển Động'
                    )}
                </button>
                
                {images.some(img => img.status === 'completed') && (
                    <button
                        onClick={handleDownloadAll}
                        className="w-full py-3 px-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Tải về tất cả (.txt)
                    </button>
                )}
                 
                {images.length > 0 && !isProcessing && (
                    <button
                        onClick={handleClearAll}
                        className="w-full py-2 px-4 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        Xóa tất cả
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* Right Column: Results List */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-heading mb-4 flex justify-between items-center">
                <span>Danh sách ảnh ({images.length})</span>
                <span className="text-sm font-normal text-dark-text-secondary">
                    {images.filter(i => i.status === 'completed').length} / {images.length} hoàn thành
                </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.length === 0 && (
                    <div className="col-span-full text-center py-20 border-2 border-dashed border-dark-border rounded-lg bg-dark-card">
                        <p className="text-dark-text-secondary">Chưa có ảnh nào được chọn.</p>
                    </div>
                )}

                {images.map((img) => (
                    <div key={img.id} className="bg-dark-card p-3 rounded-lg border border-dark-border flex flex-col gap-3 animate-fade-in h-full shadow-lg hover:border-brand-purple/50 transition-colors">
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-video flex-shrink-0 bg-black rounded-md overflow-hidden group">
                            <img src={img.previewUrl} alt={img.file.name} className="w-full h-full object-cover" />
                            {!isProcessing && (
                                <button 
                                    onClick={() => handleRemoveImage(img.id)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                                    title="Xóa ảnh"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                            
                            <div className="absolute bottom-1 right-1 z-10">
                                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm ${
                                    img.status === 'completed' ? 'bg-green-600 text-white' :
                                    img.status === 'processing' ? 'bg-blue-600 text-white' :
                                    img.status === 'error' ? 'bg-red-600 text-white' :
                                    'bg-gray-600 text-white'
                                }`}>
                                    {img.status === 'completed' ? 'OK' :
                                     img.status === 'processing' ? '...' :
                                     img.status === 'error' ? 'Lỗi' : 'Chờ'}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            <h3 className="font-semibold text-heading truncate text-xs w-full mb-2" title={img.file.name}>
                                {img.file.name}
                            </h3>

                            {img.status === 'processing' && (
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-auto">
                                    <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                                </div>
                            )}

                            {img.status === 'error' && (
                                <p className="text-red-400 text-xs mb-auto">{img.error}</p>
                            )}

                            {img.status === 'completed' && img.prompt && (
                                <div className="relative flex-grow mt-auto">
                                    <textarea
                                        readOnly
                                        value={img.prompt}
                                        className="w-full h-24 p-2 pr-8 bg-gray-900/50 border border-dark-border rounded text-xs text-cyan-300 font-mono resize-none focus:outline-none scrollbar-thin"
                                    />
                                    <button
                                        onClick={() => handleCopy(img.prompt!, img.id)}
                                        className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-brand-purple rounded transition-colors"
                                        title="Sao chép prompt"
                                    >
                                        <CopyIcon isCopied={copiedId === img.id} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToMotionGenerator;
