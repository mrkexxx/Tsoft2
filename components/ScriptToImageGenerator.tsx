import React, { useState, useMemo, useEffect } from 'react';
import ScriptInput from './ScriptInput';
import OptionsPanel from './OptionsPanel';
import PromptList from './PromptList';
import Loader from './Loader';
import ImageViewer from './ImageViewer';
import PageHeader from './PageHeader';
import { GeneratedPrompt, GeneratedImage } from '../types';
import { generatePromptsFromScript, generateImageFromPrompt } from '../services/geminiService';


interface ScriptToImageGeneratorProps {
  onGoHome: () => void;
}

const ScriptToImageGenerator: React.FC<ScriptToImageGeneratorProps> = ({ onGoHome }) => {
  const [script, setScript] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(1);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [style, setStyle] = useState<string>('Default');
  
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState<boolean>(false);
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loadingImageScene, setLoadingImageScene] = useState<string | null>(null);
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState<boolean>(false);

  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
  const [viewingImage, setViewingImage] = useState<{imageData: string; sceneName: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatedImageMap = useMemo(() => {
    return new Map(generatedImages.map(img => [img.sceneName, img.imageData]));
  }, [generatedImages]);

  const handleStartOver = () => {
    setScript('');
    setFileName(null);
    setDurationMinutes(1);
    setDurationSeconds(0);
    setStyle('Default');
    setGeneratedPrompts([]);
    setError(null);
    setIsLoadingPrompts(false);
    setGeneratedImages([]);
    setLoadingImageScene(null);
    setSelectedPrompts(new Set());
    setIsGeneratingAllImages(false);
    setViewingImage(null);
  };

  const handleGeneratePrompts = async () => {
    if (!script.trim()) {
      setError("Vui lòng nhập hoặc tải lên một kịch bản hoặc ý tưởng.");
      return;
    }
    setIsLoadingPrompts(true);
    setError(null);
    try {
      const totalSeconds = durationMinutes * 60 + durationSeconds;
      const numberOfPrompts = Math.round(totalSeconds / 5);

      if (numberOfPrompts <= 0) {
        setError("Tổng thời lượng phải lớn hơn 0 để tạo prompt.");
        setIsLoadingPrompts(false);
        return;
      }

      const totalDurationInMinutes = durationMinutes + (durationSeconds / 60);
      const prompts = await generatePromptsFromScript(script, numberOfPrompts, style, totalDurationInMinutes);
      setGeneratedPrompts(prompts);
      setGeneratedImages([]); // Reset ảnh khi tạo prompt mới

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi không xác định khi tạo prompt.");
      }
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleGenerateImage = async (prompt: string, sceneName: string) => {
    setLoadingImageScene(sceneName);
    setError(null);
    try {
      const imageData = await generateImageFromPrompt(prompt);
      const newGeneratedImages = [
        ...generatedImages.filter(img => img.sceneName !== sceneName),
        { sceneName, imageData }
      ];
      setGeneratedImages(newGeneratedImages);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định khi tạo ảnh.";
      setError(errorMessage);
    } finally {
      setLoadingImageScene(null);
    }
  };
  
  const handleTogglePromptSelection = (sceneName: string) => {
    setSelectedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sceneName)) {
        newSet.delete(sceneName);
      } else {
        if (newSet.size >= 10) {
          setError("Bạn chỉ có thể chọn tối đa 10 prompt để tạo ảnh cùng lúc.");
        } else {
          newSet.add(sceneName);
        }
      }
      return newSet;
    });
  };

  const handleSelectAllPrompts = (select: boolean) => {
    if (select) {
      if (generatedPrompts.length > 10) {
        setError("Chỉ có thể chọn tối đa 10 prompt. Đã chọn 10 prompt đầu tiên.");
        const firstTenSceneNames = new Set(generatedPrompts.slice(0, 10).map(p => p.sceneName));
        setSelectedPrompts(firstTenSceneNames);
      } else {
        const allSceneNames = new Set(generatedPrompts.map(p => p.sceneName));
        setSelectedPrompts(allSceneNames);
      }
    } else {
      setSelectedPrompts(new Set());
    }
  };

  const handleGenerateSelectedImages = async () => {
    if (selectedPrompts.size === 0) {
      setError("Vui lòng chọn ít nhất một prompt để tạo ảnh.");
      return;
    }
    setIsGeneratingAllImages(true);
    const promptsToGenerate = generatedPrompts.filter(p => selectedPrompts.has(p.sceneName));
    for (const prompt of promptsToGenerate) {
      if (!generatedImageMap.has(prompt.sceneName)) {
        await handleGenerateImage(prompt.imagePrompt, prompt.sceneName);
      }
    }
    setIsGeneratingAllImages(false);
  };
  
  const handleSaveAllGeneratedImages = () => {
    if (generatedImages.length === 0) {
      setError("Chưa có ảnh nào được tạo để lưu.");
      return;
    }
    generatedImages.forEach((image, index) => {
      const link = document.createElement('a');
      link.href = image.imageData;
      const safeFileName = image.sceneName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeFileName}.jpeg`;
      // Stagger downloads slightly to improve browser compatibility
      setTimeout(() => {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 200);
    });
  };

  const handleViewImage = (imageData: string, sceneName: string) => {
    setViewingImage({ imageData, sceneName });
  };

  const handleCloseViewer = () => {
    setViewingImage(null);
  };

  return (
    <div className="animate-fade-in">
        <PageHeader title="Tạo hình ảnh theo kịch bản" onBack={onGoHome} />

        {(isLoadingPrompts || isGeneratingAllImages) && <Loader message={isGeneratingAllImages ? 'Đang tạo ảnh hàng loạt...' : 'Đang tạo prompts...'} />}
        {loadingImageScene && <Loader message={`Đang tạo ảnh cho ${loadingImageScene}...`} />}
        {viewingImage && <ImageViewer imageData={viewingImage.imageData} sceneName={viewingImage.sceneName} onClose={handleCloseViewer} />}

        {error && (
            <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Lỗi! </strong>
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
            </div>
        )}

        {generatedPrompts.length === 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <ScriptInput script={script} setScript={setScript} fileName={fileName} setFileName={setFileName} />
              </div>
              <div className="lg:col-span-1">
                 <OptionsPanel
                    durationMinutes={durationMinutes}
                    setDurationMinutes={setDurationMinutes}
                    durationSeconds={durationSeconds}
                    setDurationSeconds={setDurationSeconds}
                    style={style}
                    setStyle={setStyle}
                    onGeneratePrompts={handleGeneratePrompts}
                    isLoadingPrompts={isLoadingPrompts}
                    scriptIsEmpty={!script.trim()}
                />
              </div>
            </div>
            {!isLoadingPrompts && (
              <div className="mt-8 text-center py-16 px-6 bg-dark-card border border-dashed border-dark-border rounded-lg lg:col-span-3">
                  <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-xl font-semibold text-white">Chưa có kết quả nào</h3>
                  <p className="mt-1 text-md text-dark-text-secondary">Nhập ý tưởng kịch bản và nhấn 'Tạo Prompt' để bắt đầu.</p>
              </div>
            )}
          </>
        ) : (
           <div className="animate-fade-in">
            <PromptList
              prompts={generatedPrompts}
              onGenerateImage={handleGenerateImage}
              loadingImageScene={loadingImageScene}
              generatedImages={generatedImages}
              selectedPrompts={selectedPrompts}
              onToggleSelection={handleTogglePromptSelection}
              onSelectAll={handleSelectAllPrompts}
              onGenerateSelected={handleGenerateSelectedImages}
              isGeneratingAll={isGeneratingAllImages}
              onSaveAll={handleSaveAllGeneratedImages}
              onViewImage={handleViewImage}
            />

            <div className="text-center mt-8">
                <button onClick={handleStartOver} className="py-2 px-5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    Làm lại từ đầu
                </button>
            </div>
           </div>
        )}
    </div>
  );
};

export default ScriptToImageGenerator;
