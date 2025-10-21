import React, { useState } from 'react';
import { generateYouTubeSeo } from '../services/geminiService';
import { YouTubeSeoResult } from '../types';
import Loader from './Loader';
import PageHeader from './PageHeader';

interface YouTubeSeoGeneratorProps {
  onGoHome: () => void;
}

const CopyIcon: React.FC<{isCopied: boolean}> = ({ isCopied }) => {
    if (isCopied) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        )
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    )
}

const YouTubeSeoGenerator: React.FC<YouTubeSeoGeneratorProps> = ({ onGoHome }) => {
    const [channelName, setChannelName] = useState('');
    const [videoContent, setVideoContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [seoResult, setSeoResult] = useState<YouTubeSeoResult | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!channelName.trim() || !videoContent.trim()) {
            setError('Vui lòng nhập Tên kênh và Nội dung video.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSeoResult(null);
        try {
            const result = await generateYouTubeSeo(channelName, videoContent);
            setSeoResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        });
    };
    
    const handleStartOver = () => {
        setChannelName('');
        setVideoContent('');
        setSeoResult(null);
        setError(null);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {isLoading && <Loader message="AI đang sáng tạo nội dung SEO..." />}
            
            <PageHeader title="Viết tiêu đề chuẩn SEO Youtube" onBack={onGoHome} />

            {error && (
                <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Lỗi! </strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
                </div>
            )}
            
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6">
                <div>
                    <label htmlFor="channel-name" className="block text-md font-medium text-dark-text-secondary mb-2">Tên kênh</label>
                    <input
                        id="channel-name"
                        type="text"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="Ví dụ: Tifo Official"
                        className="w-full p-3 bg-gray-900/50 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple"
                    />
                </div>
                <div>
                    <label htmlFor="video-content" className="block text-md font-medium text-dark-text-secondary mb-2">Nội dung video</label>
                    <textarea
                        id="video-content"
                        value={videoContent}
                        onChange={(e) => setVideoContent(e.target.value)}
                        placeholder="Mô tả chi tiết về nội dung video của bạn. Càng chi tiết, kết quả càng chính xác."
                        className="w-full h-40 p-3 bg-gray-900/50 border border-dark-border rounded-lg resize-y focus:ring-2 focus:ring-brand-purple"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                >
                    Tạo nội dung SEO
                </button>
            </div>
            
            {seoResult && (
                <div className="mt-8 bg-dark-card p-6 rounded-lg border border-dark-border space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold text-white text-center">Kết quả SEO</h2>

                    {/* Tiêu đề */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-brand-light-purple">Tiêu đề gợi ý</h3>
                        <ul className="space-y-2">
                            {seoResult.titles.map((title, index) => (
                                <li key={index} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-md">
                                    <span className="flex-1 pr-4 text-dark-text">{index + 1}. {title}</span>
                                    <button onClick={() => handleCopy(title, `title-${index}`)} className="p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label="Sao chép tiêu đề">
                                        <CopyIcon isCopied={copiedKey === `title-${index}`} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Mô tả */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-brand-light-purple">Mô tả video</h3>
                        <div className="relative bg-gray-900/50 p-3 rounded-md">
                             <p className="text-dark-text whitespace-pre-wrap">{seoResult.description}</p>
                             <button onClick={() => handleCopy(seoResult.description, 'description')} className="absolute top-2 right-2 p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label="Sao chép mô tả">
                                <CopyIcon isCopied={copiedKey === 'description'} />
                             </button>
                        </div>
                    </div>

                    {/* Hashtags */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-brand-light-purple">Hashtags</h3>
                         <div className="relative bg-gray-900/50 p-3 rounded-md">
                             <p className="text-dark-text">{seoResult.hashtags}</p>
                              <button onClick={() => handleCopy(seoResult.hashtags, 'hashtags')} className="absolute top-2 right-2 p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label="Sao chép hashtags">
                                <CopyIcon isCopied={copiedKey === 'hashtags'} />
                             </button>
                        </div>
                    </div>

                    {/* Từ khóa */}
                     <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-brand-light-purple">Từ khóa (Tags)</h3>
                         <div className="relative bg-gray-900/50 p-3 rounded-md">
                             <p className="text-dark-text">{seoResult.keywords}</p>
                              <button onClick={() => handleCopy(seoResult.keywords, 'keywords')} className="absolute top-2 right-2 p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label="Sao chép từ khóa">
                                <CopyIcon isCopied={copiedKey === 'keywords'} />
                             </button>
                        </div>
                    </div>

                </div>
            )}
            
            <div className="text-center mt-8">
                {(seoResult || error) && (
                     <button onClick={handleStartOver} className="py-2 px-5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Làm lại
                    </button>
                )}
            </div>
        </div>
    );
};

export default YouTubeSeoGenerator;
