import React, { useState } from 'react';
import ScriptInput from './ScriptInput';
import OptionsPanel from './OptionsPanel';
import PromptList from './PromptList';
import Loader from './Loader';
import PageHeader from './PageHeader';
import { GeneratedPrompt } from '../types';
import { generatePromptsFromScript } from '../services/geminiService';


interface ScriptToImageGeneratorProps {
  onGoHome: () => void;
}

const ScriptToImageGenerator: React.FC<ScriptToImageGeneratorProps> = ({ onGoHome }) => {
  const [script, setScript] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(1);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [promptInterval, setPromptInterval] = useState<number>(5);
  const [style, setStyle] = useState<string>('Default');
  
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);

  const handleStartOver = () => {
    setScript('');
    setFileName(null);
    setDurationMinutes(1);
    setDurationSeconds(0);
    setPromptInterval(5);
    setStyle('Default');
    setGeneratedPrompts([]);
    setError(null);
    setIsLoadingPrompts(false);
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
      const numberOfPrompts = Math.round(totalSeconds / promptInterval);

      if (numberOfPrompts <= 0) {
        setError("Tổng thời lượng phải lớn hơn 0 để tạo prompt.");
        setIsLoadingPrompts(false);
        return;
      }

      const totalDurationInMinutes = durationMinutes + (durationSeconds / 60);
      const prompts = await generatePromptsFromScript(script, numberOfPrompts, style, totalDurationInMinutes);
      setGeneratedPrompts(prompts);

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

  return (
    <div className="animate-fade-in">
        <PageHeader title="Tạo hình ảnh theo kịch bản" onBack={onGoHome} />

        {isLoadingPrompts && <Loader message={'Đang tạo prompts...'} />}

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
                    promptInterval={promptInterval}
                    setPromptInterval={setPromptInterval}
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