
import React, { useEffect } from 'react';

interface ImageViewerProps {
  imageData: string;
  sceneName: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageData, sceneName, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageData;
    const safeFileName = sceneName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeFileName}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-viewer-title"
    >
      <div 
        className="relative bg-dark-card rounded-lg shadow-2xl w-full max-w-4xl max-h-full flex flex-col p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
            <h2 id="image-viewer-title" className="text-lg font-semibold text-brand-light-purple truncate pr-4">{sceneName}</h2>
            <button
                onClick={onClose}
                className="p-2 text-dark-text-secondary hover:text-white transition-colors rounded-full hover:bg-gray-700"
                aria-label="Đóng"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="flex-grow flex items-center justify-center overflow-hidden">
            <img 
                src={imageData} 
                alt={sceneName} 
                className="max-w-full max-h-[75vh] object-contain"
            />
        </div>

        <div className="mt-4 flex justify-end">
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 py-2 px-5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải về
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
