import React, { useState } from 'react';
import ScriptInput from './ScriptInput';
import OptionsPanel from './OptionsPanel';
import PromptList from './PromptList';
import Loader from './Loader';
import PageHeader from './PageHeader';
import { GeneratedPrompt } from '../types';
import { generatePromptsFromScript, identifyCharactersFromScript, translateText } from '../services/geminiService';

interface ScriptToImageGeneratorProps {
  onGoHome: () => void;
}

type Step = 'script' | 'characters' | 'prompts';

interface Character {
    name: string;
    prompt: string;
    promptVietnamese: string;
}

const StepIndicator: React.FC<{ currentStep: Step; completedSteps: Set<Step>; onStepClick: (step: Step) => void }> = ({ currentStep, completedSteps, onStepClick }) => {
    const steps: { id: Step; title: string }[] = [
        { id: 'script', title: '1. Kịch bản & Tùy chọn' },
        { id: 'characters', title: '2. Nhân vật' },
        { id: 'prompts', title: '3. Kết quả Prompts' },
    ];

    return (
        <nav className="flex items-center justify-center mb-8" aria-label="Progress">
            <ol className="flex items-center space-x-2 sm:space-x-4">
                {steps.map((step, index) => {
                    const isCompleted = completedSteps.has(step.id);
                    const isCurrent = currentStep === step.id;
                    const canClick = isCompleted && !isCurrent;
                    
                    return (
                        <li key={step.id} className="flex items-center">
                            <button
                                onClick={() => canClick && onStepClick(step.id)}
                                disabled={!canClick}
                                className={`flex items-center text-sm font-medium ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <span
                                    className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-300 ${
                                        isCurrent ? 'bg-brand-purple text-white' : isCompleted ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-600 text-gray-400'
                                    }`}
                                >
                                    {isCompleted && !isCurrent ? (
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </span>
                                <span
                                    className={`ml-2 hidden sm:inline transition-colors duration-300 ${
                                        isCurrent ? 'text-white' : isCompleted ? 'text-gray-300 hover:text-white' : 'text-gray-500'
                                    }`}
                                >
                                    {step.title}
                                </span>
                            </button>
                            {index < steps.length - 1 && (
                                <div className="flex-1 w-8 sm:w-16 h-0.5 bg-gray-600 ml-2 sm:ml-4"></div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};


const ScriptToImageGenerator: React.FC<ScriptToImageGeneratorProps> = ({ onGoHome }) => {
  const [step, setStep] = useState<Step>('script');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  
  const [script, setScript] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(1);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [promptInterval, setPromptInterval] = useState<number>(5);
  const [style, setStyle] = useState<string>('Default');
  const [characterNationality, setCharacterNationality] = useState<string>('Default');
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  const handleStartOver = () => {
    setStep('script');
    setCompletedSteps(new Set());
    setScript('');
    setFileName(null);
    setDurationMinutes(1);
    setDurationSeconds(0);
    setPromptInterval(5);
    setStyle('Default');
    setGeneratedPrompts([]);
    setCharacters([]);
    setCharacterNationality('Default');
    setError(null);
    setIsLoading(false);
  };

  const handleStepClick = (clickedStep: Step) => {
    if(completedSteps.has(clickedStep) || clickedStep === 'script') {
        // FIX: Corrected function name from 'setCurrentStep' to 'setStep' and passed the correct step.
        setStep(clickedStep);
    }
  };

  const handleCharacterChange = (index: number, field: 'prompt' | 'promptVietnamese', value: string) => {
    setCharacters(prev => {
        const newCharacters = [...prev];
        newCharacters[index] = { ...newCharacters[index], [field]: value };
        return newCharacters;
    });
  };

  const handleAnalyzeCharacters = async () => {
    if (!script.trim()) {
      setError("Vui lòng nhập hoặc tải lên một kịch bản hoặc ý tưởng.");
      return;
    }
    const totalSecondsValue = durationMinutes * 60 + durationSeconds;
    if (totalSecondsValue <= 0) {
      setError("Tổng thời lượng phải lớn hơn 0 để tạo prompt.");
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('AI đang phân tích kịch bản và xác định nhân vật...');
    setError(null);

    try {
      const identifiedChars = await identifyCharactersFromScript(script, characterNationality);
      
      if (identifiedChars && identifiedChars.length > 0) {
        setLoadingMessage('Đang dịch mô tả nhân vật...');
        const charsWithTranslations = await Promise.all(
            identifiedChars.map(async (char) => {
                const translatedPrompt = await translateText(char.prompt, 'Vietnamese');
                return { ...char, promptVietnamese: translatedPrompt };
            })
        );
        setCharacters(charsWithTranslations);
      } else {
        setCharacters([]); // No characters found, proceed with an empty list
      }
      
      setCompletedSteps(prev => new Set(prev).add('script'));
      setStep('characters');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định khi phân tích nhân vật.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompts = async () => {
    setIsLoading(true);
    setLoadingMessage('Đang tạo các prompt chi tiết...');
    setError(null);
    try {
      const totalSeconds = durationMinutes * 60 + durationSeconds;
      const numberOfPrompts = Math.round(totalSeconds / promptInterval);

      const totalDurationInMinutes = durationMinutes + (durationSeconds / 60);
      const prompts = await generatePromptsFromScript(script, numberOfPrompts, style, totalDurationInMinutes, characters);
      setGeneratedPrompts(prompts);
      setCompletedSteps(prev => new Set(prev).add('characters'));
      setStep('prompts');

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi không xác định khi tạo prompt.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch(step) {
      case 'script':
        return (
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
                  characterNationality={characterNationality}
                  setCharacterNationality={setCharacterNationality}
                  onNextStep={handleAnalyzeCharacters}
                  nextStepButtonText="Tiếp: Phân tích nhân vật"
                  isLoading={isLoading}
                  scriptIsEmpty={!script.trim()}
              />
            </div>
          </div>
        );
      case 'characters':
        return (
          <div className="bg-dark-card p-4 sm:p-8 rounded-xl shadow-2xl border border-dark-border animate-fade-in">
            <h2 className="text-2xl font-bold text-center">Bước 2: Chỉnh sửa và cố định nhân vật</h2>
            <p className="text-center text-dark-text-secondary mt-2 mb-6">AI đã phân tích kịch bản và tạo mô tả. Bạn có thể chỉnh sửa lại trước khi tạo phân cảnh để đảm bảo tính nhất quán.</p>
            
            {characters.length > 0 ? (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto p-2 rounded-md">
                {characters.map((char, index) => (
                  <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-dark-border">
                    <h3 className="font-bold text-lg mb-3 text-brand-light-purple">{char.name}</h3>
                    <div className="space-y-4">
                      <div>
                          <label htmlFor={`char-prompt-vi-${index}`} className="block text-sm font-medium text-dark-text-secondary mb-1">Mô tả (Tiếng Việt)</label>
                          <textarea
                              id={`char-prompt-vi-${index}`}
                              value={char.promptVietnamese}
                              onChange={(e) => handleCharacterChange(index, 'promptVietnamese', e.target.value)}
                              rows={3}
                              className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple"
                          />
                      </div>
                      <div>
                          <label htmlFor={`char-prompt-en-${index}`} className="block text-sm font-medium text-dark-text-secondary mb-1">Prompt gốc (Tiếng Anh - Dùng để tạo ảnh)</label>
                          <textarea
                              id={`char-prompt-en-${index}`}
                              value={char.prompt}
                              onChange={(e) => handleCharacterChange(index, 'prompt', e.target.value)}
                              rows={3}
                              className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple"
                          />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center py-10 px-6 bg-gray-900/50 border border-dashed border-dark-border rounded-lg">
                    <h3 className="text-xl font-semibold text-white">Không tìm thấy nhân vật</h3>
                    <p className="mt-1 text-md text-dark-text-secondary">AI không tìm thấy nhân vật nào cần theo dõi trong kịch bản của bạn.</p>
                </div>
            )}
            <button
              onClick={handleGeneratePrompts}
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition-colors"
            >
              Tiếp tục: Tạo Prompts
            </button>
          </div>
        );
      case 'prompts':
        return (
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
        );
    }
  }

  return (
    <div className="animate-fade-in">
        <PageHeader title="Tạo hình ảnh theo kịch bản" onBack={onGoHome} />

        {isLoading && <Loader message={loadingMessage} />}

        <StepIndicator currentStep={step} completedSteps={completedSteps} onStepClick={handleStepClick} />

        {error && (
            <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Lỗi! </strong>
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
            </div>
        )}

        {renderContent()}
    </div>
  );
};

export default ScriptToImageGenerator;