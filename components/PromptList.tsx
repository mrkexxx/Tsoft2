import React, { useState } from 'react';
import { GeneratedPrompt } from '../types';

interface PromptListProps {
  prompts: GeneratedPrompt[];
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
  prompts
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleDownloadPrompts = (type: 'image' | 'video') => {
    if (prompts.length === 0) return;
    
    let content = '';
    if (type === 'image') {
      content = prompts.map(p => p.imagePrompt).join('\n');
    } else {
      content = prompts.map(p => p.videoPrompt).join('\n\n---\n\n');
    }

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
    </div>
  );
};

export default PromptList;