
import React, { useState } from 'react';
import { GeneratedPrompt, GeneratedImage } from '../types';

interface PromptListProps {
  prompts: GeneratedPrompt[];
  onGenerateImage: (prompt: string, sceneName: string) => void;
  loadingImageScene: string | null;
  generatedImages: GeneratedImage[];
  selectedPrompts: Set<string>;
  onToggleSelection: (sceneName: string) => void;
  onSelectAll: (select: boolean) => void;
  onGenerateSelected: () => void;
  isGeneratingAll: boolean;
  onSaveAll: () => void;
  onViewImage: (imageData: string, sceneName: string) => void;
}

const PromptItem: React.FC<{
  title: string;
  prompt: string;
  onCopy: () => void;
  isCopied: boolean;
}> = ({ title, prompt, onCopy, isCopied }) => {
  return (
    <div className="relative">
      <h4 className="text-md font-semibold text-dark-text-secondary mb-1">{title}</h4>
      <div className="relative">
        <p className="text-dark-text leading-relaxed bg-gray-900/50 p-3 rounded-md pr-12 w-full text-sm">
          {prompt}
        </p>
        <button
          onClick={onCopy}
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-gray-700 hover:bg-brand-purple text-white font-bold p-2 rounded-lg transition-colors duration-300 flex items-center"
          aria-label={`Sao chép ${title}`}
        >
          {isCopied ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Sao chép</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const PromptList: React.FC<PromptListProps> = ({ 
  prompts, 
  onGenerateImage, 
  loadingImageScene, 
  generatedImages,
  selectedPrompts,
  onToggleSelection,
  onSelectAll,
  onGenerateSelected,
  isGeneratingAll,
  onSaveAll,
  onViewImage
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const generatedImageMap = new Map(generatedImages.map(img => [img.sceneName, img.imageData]));

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleDownloadPrompts = (type: 'image' | 'video') => {
    if (prompts.length === 0) return;
    const content = prompts.map(p => type === 'image' ? p.imagePrompt : p.videoPrompt).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_prompts.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isAllSelected = prompts.length > 0 && selectedPrompts.size === prompts.length;
  const anyImageGenerated = generatedImages.length > 0;

  return (
    <div className="mt-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold">Bước 2: Kết quả Prompt</h2>
        <p className="text-dark-text-secondary">Đây là các prompt được tạo ra từ kịch bản của bạn.</p>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => handleDownloadPrompts('image')}
            className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <DownloadIcon />
            Tải Prompt Ảnh
          </button>
          <button
            onClick={() => handleDownloadPrompts('video')}
            className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <DownloadIcon />
            Tải Prompt Video
          </button>
        </div>
      </div>
       <div className="space-y-8">
         {prompts.map((p, index) => (
            <div key={index} className="bg-dark-card p-4 rounded-lg shadow-lg border border-dark-border">
              <h3 className="text-lg font-semibold text-brand-light-purple mb-2">{p.sceneName}</h3>
              <p className="text-dark-text-secondary mb-4 italic text-sm">{p.sceneDescription}</p>
              <div className="space-y-4">
                  <PromptItem 
                    title="Prompt Ảnh"
                    prompt={p.imagePrompt}
                    onCopy={() => handleCopy(p.imagePrompt, `${index}-image`)}
                    isCopied={copiedKey === `${index}-image`}
                  />
                  <PromptItem 
                    title="Prompt Video"
                    prompt={p.videoPrompt}
                    onCopy={() => handleCopy(p.videoPrompt, `${index}-video`)}
                    isCopied={copiedKey === `${index}-video`}
                  />
              </div>
            </div>
         ))}
      </div>

      <div className="mt-12">
        <div className="text-center mb-6">
            <h2 className="text-3xl font-bold">Bước 3: Tạo hình ảnh</h2>
            <p className="text-dark-text-secondary">Chọn các prompt và tạo hình ảnh tương ứng.</p>
            <p className="text-sm text-yellow-500 mt-1">(chỉ cho phép tạo 10 prompt cùng lúc)</p>
        </div>
        
        <div className="sticky top-4 z-10 bg-dark-card/80 backdrop-blur-sm p-4 rounded-lg border border-dark-border mb-6 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="select-all"
                    className="h-5 w-5 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    disabled={isGeneratingAll}
                />
                <label htmlFor="select-all" className="ml-2 text-md font-medium text-dark-text">
                    Chọn tất cả ({selectedPrompts.size}/{prompts.length})
                </label>
            </div>
            <button
                onClick={onGenerateSelected}
                disabled={isGeneratingAll || selectedPrompts.size === 0}
                className="flex items-center justify-center py-2 px-5 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
            >
                Tạo ảnh đã chọn
            </button>
            <button
                onClick={onSaveAll}
                disabled={isGeneratingAll || !anyImageGenerated}
                className="flex items-center justify-center py-2 px-5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
            >
                Lưu tất cả ảnh đã tạo
            </button>
        </div>

        <div className="space-y-8">
            {prompts.map((p) => {
                const generatedImageData = generatedImageMap.get(p.sceneName);
                const isThisImageLoading = loadingImageScene === p.sceneName;
                const isSelected = selectedPrompts.has(p.sceneName);

                return (
                    <div key={p.sceneName} className={`bg-dark-card p-4 rounded-lg shadow-lg border-2 transition-colors ${isSelected ? 'border-brand-purple' : 'border-dark-border'}`}>
                        <div className="flex items-start gap-4">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelection(p.sceneName)}
                                className="h-5 w-5 mt-1 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                                disabled={isGeneratingAll || !!loadingImageScene}
                                aria-label={`Chọn ${p.sceneName}`}
                            />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-brand-light-purple mb-1">{p.sceneName}</h3>
                                <p className="text-sm text-dark-text-secondary leading-relaxed pr-12 w-full">{p.imagePrompt}</p>
                            </div>
                        </div>

                        <div className="mt-4 pl-9">
                          {generatedImageData ? (
                            <div className="relative group rounded-lg overflow-hidden border border-dark-border cursor-pointer" onClick={() => onViewImage(generatedImageData, p.sceneName)}>
                              <img src={generatedImageData} alt={p.sceneName} className="w-full h-auto aspect-video object-cover" />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onGenerateImage(p.imagePrompt, p.sceneName); }}
                                  disabled={!!loadingImageScene || isGeneratingAll}
                                  className="flex items-center gap-2 py-2 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                                >
                                  {isThisImageLoading ? 'Đang tạo...' : 'Tạo lại'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => onGenerateImage(p.imagePrompt, p.sceneName)}
                              disabled={!!loadingImageScene || isGeneratingAll}
                              className="w-full flex items-center justify-center py-2 px-4 font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              {isThisImageLoading ? 'Đang tạo ảnh...' : 'Tạo ảnh'}
                            </button>
                          )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default PromptList;
