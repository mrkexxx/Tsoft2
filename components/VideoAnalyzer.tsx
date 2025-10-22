import React, { useState, useRef } from 'react';
import PageHeader from './PageHeader';
import Loader from './Loader';
// FIX: Import VideoAnalysisResult directly from types.ts instead of from geminiService.ts to resolve the module export error.
import { analyzeVideoFromFile, generateVeoPromptsFromScenes } from '../services/geminiService';
import type { VideoAnalysisResult } from '../types';

interface VideoAnalyzerProps {
  onGoHome: () => void;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ onGoHome }) => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
    const [veoPrompts, setVeoPrompts] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('video/')) {
                setError('Vui lòng tải lên một tệp video hợp lệ.');
                setVideoFile(null);
                setVideoPreviewUrl(null);
                return;
            }
            // Reset state for new video
            setVideoFile(file);
            setVideoPreviewUrl(URL.createObjectURL(file));
            setAnalysisResult(null);
            setVeoPrompts(null);
            setError(null);
        }
    };
    
    const handleAnalyzeVideo = async () => {
        if (!videoFile) {
            setError('Vui lòng tải video lên trước.');
            return;
        }
        setIsLoading(true);
        setLoadingMessage('AI đang phân tích video. Quá trình này có thể mất vài phút...');
        setError(null);
        setAnalysisResult(null);
        setVeoPrompts(null);

        try {
            const result = await analyzeVideoFromFile(videoFile);
            setAnalysisResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi phân tích video.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGeneratePrompts = async () => {
        if (!analysisResult || analysisResult.scenes.length === 0) {
            setError('Không có phân cảnh nào để tạo prompt.');
            return;
        }
        setIsLoading(true);
        setLoadingMessage('AI đang tạo prompt video...');
        setError(null);
        setVeoPrompts(null);

        try {
            const prompts = await generateVeoPromptsFromScenes(analysisResult.scenes);
            setVeoPrompts(prompts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi tạo prompt.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadPrompts = () => {
        if (!veoPrompts || veoPrompts.length === 0) return;
        const content = veoPrompts.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `veo_prompts_${videoFile?.name.split('.')[0] || 'analysis'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {isLoading && <Loader message={loadingMessage} />}
            
            <PageHeader title="Phân tích Video và Tạo Prompt" onBack={onGoHome} />

            {error && (
                <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Lỗi! </strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
                </div>
            )}

            <div className="space-y-8">
                {/* Step 1: Upload */}
                <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6">
                    <h2 className="text-2xl font-bold text-white">Bước 1: Tải lên và Phân tích Video</h2>
                    <div 
                        className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-brand-purple transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                            ref={fileInputRef}
                            aria-label="Tải lên video"
                        />
                        {videoPreviewUrl ? (
                            <video src={videoPreviewUrl} controls className="max-h-64 mx-auto rounded-lg shadow-lg" />
                        ) : (
                            <div>
                                <UploadIcon />
                                <p className="text-dark-text-secondary">Nhấn để tải lên video của bạn</p>
                                <p className="text-xs text-gray-500 mt-1">MP4, MOV, WEBM, etc.</p>
                            </div>
                        )}
                    </div>
                    {videoFile && (
                        <p className="text-center text-dark-text-secondary">Tệp đã chọn: {videoFile.name}</p>
                    )}
                    <button
                        onClick={handleAnalyzeVideo}
                        disabled={!videoFile || isLoading}
                        className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                    >
                        Phân tích Video
                    </button>
                </div>

                {/* Step 2: Analysis Result */}
                {analysisResult && (
                    <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white">Bước 2: Kết quả phân tích</h2>
                        <div>
                            <h3 className="text-xl font-semibold text-brand-light-purple mb-2">Tóm tắt chung</h3>
                            <p className="p-3 bg-gray-900/50 rounded-md text-dark-text">{analysisResult.summary}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-brand-light-purple mb-2">Các phân cảnh đã xác định ({analysisResult.scenes.length})</h3>
                            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {analysisResult.scenes.map((scene, index) => (
                                    <li key={index} className="flex items-start bg-gray-900/50 p-3 rounded-md">
                                        <span className="font-bold text-brand-purple mr-3">{index + 1}.</span>
                                        <p className="flex-1 text-dark-text-secondary">{scene}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={handleGeneratePrompts}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                        >
                            Tạo Prompt Veo3
                        </button>
                    </div>
                )}
                
                {/* Step 3: Veo Prompts */}
                {veoPrompts && (
                    <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white">Bước 3: Prompt Veo3 (Tiếng Anh)</h2>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {veoPrompts.map((prompt, index) => (
                                <p key={index} className="p-3 bg-gray-900/50 rounded-md text-dark-text font-mono text-sm">{prompt}</p>
                            ))}
                        </div>
                        <button
                            onClick={handleDownloadPrompts}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                        >
                            <DownloadIcon />
                            Tải về Prompts (.txt)
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VideoAnalyzer;
