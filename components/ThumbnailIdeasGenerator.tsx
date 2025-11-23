import React, { useState, useRef } from 'react';
import PageHeader from './PageHeader';
import Loader from './Loader';
import { generateThumbnailIdeas, generatePromptFromIdea } from '../services/geminiService';
import { ThumbnailAnalysisResult, ThumbnailIdea } from '../types';

interface ThumbnailIdeasGeneratorProps {
  onGoHome: () => void;
}

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

const FileUploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const ThumbnailIdeasGenerator: React.FC<ThumbnailIdeasGeneratorProps> = ({ onGoHome }) => {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoContent, setVideoContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [result, setResult] = useState<ThumbnailAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for prompt generation per idea
  const [generatingIds, setGeneratingIds] = useState<number[]>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<{ [key: number]: string }>({});
  const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setVideoContent(text);
            setFileName(file.name);
        };
        reader.readAsText(file);
        setError(null);
    } else if (file) {
        setError("Vui lòng tải lên tệp văn bản (.txt).");
    }
  };

  const handleGenerate = async () => {
    if (!videoTitle.trim() || !videoContent.trim()) {
      setError('Vui lòng nhập Tiêu đề và Nội dung video (hoặc tải lên file kịch bản).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setGeneratedPrompts({});

    try {
      const data = await generateThumbnailIdeas(videoTitle, videoContent);
      setResult(data);
    } catch (err) {
      console.error("Error generating thumbnail ideas:", err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePromptForIdea = async (idea: ThumbnailIdea, index: number) => {
      if (generatingIds.includes(index)) return;

      setGeneratingIds(prev => [...prev, index]);
      try {
          const videoInfo = `Title: ${videoTitle}\nContent: ${videoContent.substring(0, 1000)}...`; // Truncate for prompt context to save tokens
            
          const prompt = await generatePromptFromIdea(idea, videoInfo);
          setGeneratedPrompts(prev => ({ ...prev, [index]: prompt }));
      } catch (err) {
          console.error("Lỗi tạo prompt:", err);
      } finally {
          setGeneratingIds(prev => prev.filter(id => id !== index));
      }
  };

  const handleCopyPrompt = (text: string, index: number) => {
      navigator.clipboard.writeText(text).then(() => {
          setCopiedPromptId(index);
          setTimeout(() => setCopiedPromptId(null), 2000);
      });
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-20">
      <PageHeader title="Gợi ý Ý tưởng Thumbnail Youtube" onBack={onGoHome} />
      {isLoading && <Loader message="AI đang phân tích nội dung và tìm kiếm ý tưởng triệu view..." />}

      {error && (
        <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Lỗi! </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
        </div>
      )}

      {/* --- SECTION 1: INPUT --- */}
      <div className="bg-dark-card p-8 rounded-xl border border-dark-border shadow-lg mb-12">
        <div className="space-y-6">
             <div>
                 <label className="block text-lg font-bold text-heading mb-2">Tiêu đề Video</label>
                 <input 
                  type="text" 
                  value={videoTitle} 
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Ví dụ: Hướng dẫn làm video Youtube bằng AI từ A-Z" 
                  className="w-full p-4 bg-gray-900/50 border border-dark-border rounded-xl focus:ring-2 focus:ring-brand-purple transition-all text-lg"
                />
             </div>
             
             <div>
                 <div className="flex justify-between items-center mb-2">
                    <label className="block text-lg font-bold text-heading">Nội dung / Kịch bản Video</label>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center text-sm py-1.5 px-3 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors border border-gray-600"
                    >
                        <FileUploadIcon /> Tải lên file (.txt)
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />
                 </div>
                 <textarea 
                  value={videoContent} 
                  onChange={(e) => setVideoContent(e.target.value)}
                  placeholder="Nhập mô tả ngắn gọn hoặc dán toàn bộ kịch bản video vào đây..." 
                  className="w-full h-40 p-4 bg-gray-900/50 border border-dark-border rounded-xl focus:ring-2 focus:ring-brand-purple transition-all text-base resize-y"
                />
                {fileName && <p className="text-sm text-green-400 mt-2">Đã tải nội dung từ tệp: {fileName}</p>}
             </div>

             <div className="pt-4 text-center">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !videoTitle.trim() || !videoContent.trim()}
                    className="py-3 px-12 font-bold text-white text-lg bg-gradient-to-r from-brand-purple to-brand-light-purple rounded-full hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                    {isLoading ? 'Đang phân tích...' : 'Phân tích & Tìm ý tưởng'}
                </button>
             </div>
        </div>
      </div>


      {/* --- SECTION 2: RESULTS --- */}
      {result ? (
        <div className="animate-fade-in space-y-10">
          
          {/* Best Choice - Full Width */}
          <div>
              <h2 className="text-2xl font-bold text-heading mb-6 flex items-center">
                <span className="bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                Lựa chọn tối ưu nhất
            </h2>
            <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/50 p-8 rounded-2xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 bg-yellow-500 text-black font-bold text-xs px-4 py-1.5 rounded-bl-xl shadow-md">
                    EDITOR'S CHOICE
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left Info */}
                    <div className="space-y-6">
                         <div>
                             <p className="text-sm text-yellow-500/80 uppercase font-bold tracking-wider mb-2">Hook Text (Chữ trên hình)</p>
                             <div className="bg-black/40 p-5 rounded-xl border border-yellow-500/20 backdrop-blur-sm">
                                <p className="text-4xl font-black text-white leading-tight">"{result.ideas[result.bestChoiceIndex].text}"</p>
                             </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-400 mb-1">Màu sắc chủ đạo</p>
                                <p className="font-semibold text-white">{result.ideas[result.bestChoiceIndex].colors}</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-400 mb-1">Font chữ gợi ý</p>
                                <p className="font-semibold text-white">{result.ideas[result.bestChoiceIndex].font}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-yellow-500/80 uppercase font-bold tracking-wider mb-2">Tại sao chọn ý tưởng này?</p>
                            <p className="text-gray-300 italic text-sm leading-relaxed bg-yellow-900/10 p-3 rounded-lg border-l-2 border-yellow-500/50">{result.reasoning}</p>
                        </div>
                    </div>

                    {/* Right Info & Actions */}
                    <div className="flex flex-col h-full">
                        <div className="flex-grow">
                             <p className="text-sm text-yellow-500/80 uppercase font-bold tracking-wider mb-2">Mô tả hình ảnh (Visual)</p>
                             <p className="text-gray-200 text-lg leading-relaxed">{result.ideas[result.bestChoiceIndex].visual}</p>
                        </div>

                        {/* Action Area */}
                        <div className="mt-8 pt-6 border-t border-yellow-500/20">
                            {!generatedPrompts[result.bestChoiceIndex] ? (
                                <button
                                    onClick={() => handleGeneratePromptForIdea(result.ideas[result.bestChoiceIndex], result.bestChoiceIndex)}
                                    disabled={generatingIds.includes(result.bestChoiceIndex)}
                                    className="w-full py-3 px-6 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20 flex items-center justify-center gap-2"
                                >
                                    {generatingIds.includes(result.bestChoiceIndex) ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Đang viết prompt...
                                        </>
                                    ) : (
                                        'Tạo Prompt'
                                    )}
                                </button>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-yellow-200 uppercase">Prompt tạo ảnh:</p>
                                            <button
                                                onClick={() => handleCopyPrompt(generatedPrompts[result.bestChoiceIndex], result.bestChoiceIndex)}
                                                className="text-xs text-yellow-400 hover:text-white flex items-center gap-1"
                                            >
                                                <CopyIcon isCopied={copiedPromptId === result.bestChoiceIndex} />
                                                {copiedPromptId === result.bestChoiceIndex ? 'Đã sao chép' : 'Sao chép'}
                                            </button>
                                        </div>
                                        <textarea 
                                            readOnly 
                                            value={generatedPrompts[result.bestChoiceIndex]} 
                                            className="w-full h-24 p-3 bg-black/40 border border-yellow-500/30 rounded-lg text-xs text-white font-mono resize-none focus:outline-none scrollbar-thin"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Grid of other ideas */}
          <div>
              <h3 className="text-xl font-bold text-heading mb-6 flex items-center">
                 <span className="bg-gray-700 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                 Các ý tưởng tiềm năng khác
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.ideas.map((idea, index) => (
                    index !== result.bestChoiceIndex && (
                        <div key={index} className="bg-dark-card p-6 rounded-xl border border-dark-border hover:border-brand-purple/50 transition-colors flex flex-col h-full shadow-lg group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-gray-800 text-gray-300 text-xs font-bold px-3 py-1 rounded-full border border-gray-700">Option {index + 1}</span>
                            </div>
                            
                            <div className="mb-4 min-h-[4rem]">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hook</p>
                                <h4 className="text-2xl font-black text-white leading-tight group-hover:text-brand-light-purple transition-colors">"{idea.text}"</h4>
                            </div>

                            <div className="space-y-3 text-sm flex-grow">
                                <div className="flex flex-col gap-1">
                                     <p className="text-xs text-gray-500">Style</p>
                                     <div className="flex flex-wrap gap-2">
                                         <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300 border border-gray-700">{idea.colors}</span>
                                         <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300 border border-gray-700">{idea.font}</span>
                                     </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Visual</p>
                                    <p className="text-gray-300 leading-relaxed text-sm line-clamp-4 hover:line-clamp-none transition-all">{idea.visual}</p>
                                </div>
                            </div>

                            {/* Generate Prompt Button for Other Options */}
                            <div className="mt-6 pt-4 border-t border-dark-border/50">
                                {!generatedPrompts[index] ? (
                                    <button
                                        onClick={() => handleGeneratePromptForIdea(idea, index)}
                                        disabled={generatingIds.includes(index)}
                                        className="w-full py-2 px-3 bg-gray-800 hover:bg-brand-purple text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                         {generatingIds.includes(index) ? (
                                            <>
                                                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Đang tạo...
                                            </>
                                        ) : (
                                            'Tạo Prompt'
                                        )}
                                    </button>
                                ) : (
                                    <div className="space-y-3 animate-fade-in">
                                        <div className="relative">
                                            <textarea 
                                                readOnly 
                                                value={generatedPrompts[index]} 
                                                className="w-full h-20 p-2 pr-8 bg-gray-900/50 border border-dark-border rounded text-xs text-cyan-300 font-mono resize-none focus:outline-none scrollbar-thin"
                                            />
                                            <button
                                                onClick={() => handleCopyPrompt(generatedPrompts[index], index)}
                                                className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-brand-purple rounded text-white transition-colors"
                                                title="Sao chép"
                                            >
                                                <CopyIcon isCopied={copiedPromptId === index} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                ))}
              </div>
          </div>
        </div>
      ) : !isLoading && (
         <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-dark-border rounded-xl bg-dark-card/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-500 mb-2">Chưa có kết quả</h3>
            <p className="text-gray-500 max-w-lg">Nhập Tiêu đề và Nội dung video để AI giúp bạn tìm ra ý tưởng Thumbnail triệu view.</p>
         </div>
      )}
    </div>
  );
};

export default ThumbnailIdeasGenerator;