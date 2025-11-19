import React, { useState, useRef } from 'react';
import { generateThumbnailPromptFromImage, refineThumbnailPrompt } from '../services/geminiService';
import Loader from './Loader';
import PageHeader from './PageHeader';

interface ThumbnailGeneratorProps {
  onGoHome: () => void;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ onGoHome }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageType, setSourceImageType] = useState<string | null>(null);
  const [removeText, setRemoveText] = useState<boolean>(true);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [refinementInstruction, setRefinementInstruction] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng tải lên một tệp ảnh hợp lệ (JPEG, PNG, WEBP, etc.).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setSourceImageType(file.type);
        setGeneratedPrompt('');
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!sourceImage || !sourceImageType) {
      setError('Vui lòng tải ảnh mẫu lên trước.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('AI đang phân tích ảnh và tạo prompt...');
    setError(null);
    try {
      const base64Data = sourceImage.split(',')[1];
      const prompt = await generateThumbnailPromptFromImage(base64Data, sourceImageType, removeText);
      setGeneratedPrompt(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi tạo prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinePrompt = async () => {
    if (!generatedPrompt) {
      setError('Vui lòng tạo prompt ban đầu trước.');
      return;
    }
    if (!refinementInstruction.trim()) {
      setError('Vui lòng nhập yêu cầu chỉnh sửa.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('AI đang chỉnh sửa prompt...');
    setError(null);
    try {
      const newPrompt = await refineThumbnailPrompt(generatedPrompt, refinementInstruction);
      setGeneratedPrompt(newPrompt);
      setRefinementInstruction(''); // Clear the instruction input
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi chỉnh sửa prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
        {isLoading && <Loader message={loadingMessage} />}
        
        <PageHeader title="Tạo Thumbnail theo ảnh mẫu" onBack={onGoHome} />

        {error && (
            <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Lỗi! </strong>
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
            </div>
        )}

        <div className="space-y-8">
            {/* --- BƯỚC 1: INPUT --- */}
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6">
                <h2 className="text-2xl font-bold text-heading">Bước 1: Tải ảnh mẫu & Tạo prompt gốc</h2>
                <div 
                    className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-brand-purple transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                        aria-label="Tải lên ảnh mẫu"
                    />
                    {sourceImage ? (
                        <img src={sourceImage} alt="Ảnh mẫu đã tải lên" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                    ) : (
                        <div>
                            <UploadIcon />
                            <p className="text-dark-text-secondary">Nhấn để tải lên ảnh của bạn</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, etc.</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center space-x-3">
                    <input
                        type="checkbox"
                        id="remove-text"
                        checked={removeText}
                        onChange={(e) => setRemoveText(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-brand-purple focus:ring-brand-purple bg-gray-700"
                        disabled={!sourceImage}
                    />
                    <label htmlFor="remove-text" className="text-md font-medium text-dark-text">
                        Tự động bỏ chữ khỏi ảnh mẫu
                    </label>
                </div>
                
                <button
                    onClick={handleGeneratePrompt}
                    disabled={!sourceImage || isLoading}
                    className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                >
                    Tạo Prompt
                </button>
            </div>

            {/* --- BƯỚC 2: CHỈNH SỬA --- */}
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6">
                <h2 className="text-2xl font-bold text-heading">Bước 2: Chỉnh sửa Prompt</h2>
                
                <div>
                    <label htmlFor="generated-prompt" className="block text-md font-medium text-dark-text-secondary mb-2">Prompt (có thể chỉnh sửa)</label>
                    <div className="relative">
                        <textarea
                            id="generated-prompt"
                            value={generatedPrompt}
                            onChange={(e) => setGeneratedPrompt(e.target.value)}
                            placeholder="Prompt chi tiết sẽ xuất hiện ở đây..."
                            className="w-full h-40 p-3 pr-12 bg-gray-900/50 border border-dark-border rounded-lg resize-y focus:ring-2 focus:ring-brand-purple"
                        />
                         <button
                            onClick={handleCopyPrompt}
                            className="absolute top-2 right-2 bg-gray-700 hover:bg-brand-purple text-white p-2 rounded-lg transition-colors"
                            aria-label="Sao chép prompt"
                            disabled={!generatedPrompt}
                        >
                            {isCopied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="refinement-instruction" className="block text-md font-medium text-dark-text-secondary mb-2">Yêu cầu chỉnh sửa</label>
                    <textarea
                        id="refinement-instruction"
                        value={refinementInstruction}
                        onChange={(e) => setRefinementInstruction(e.target.value)}
                        placeholder="Ví dụ: 'thêm một con mèo', 'đổi nền thành bãi biển lúc hoàng hôn', 'làm cho nó trông điện ảnh hơn'..."
                        className="w-full p-3 bg-gray-900/50 border border-dark-border rounded-lg resize-y focus:ring-2 focus:ring-brand-purple"
                        rows={3}
                    />
                </div>

                <button
                    onClick={handleRefinePrompt}
                    disabled={!generatedPrompt || !refinementInstruction.trim() || isLoading}
                    className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                >
                    Chỉnh sửa bằng AI
                </button>
            </div>
        </div>
    </div>
  );
};

export default ThumbnailGenerator;