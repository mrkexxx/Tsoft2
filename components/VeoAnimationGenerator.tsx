import React, { useState } from 'react';
import Loader from './Loader';
import PageHeader from './PageHeader';
import { generateAnimationScenes, identifyCharactersFromScript, translateText } from '../services/geminiService';

interface VeoAnimationGeneratorProps {
  onGoHome: () => void;
}

type Step = 'script' | 'characters' | 'scenes';
type ScriptLanguage = 'Tiếng Việt' | 'Tiếng Anh' | 'Không có thoại';

interface Character {
    name: string;
    prompt: string;
    promptVietnamese: string;
}

const animationStyles = [
  'Default',
  'Điện ảnh',
  'Hoạt hình 3D',
  'Người que (Stick Figure)',
  'Anime',
  'Pixar',
  'Disney',
  'GTA V',
  'Roblox',
  'Minecraft',
  'Fortnite',
  'LEGO',
  'Claymation',
  'Watercolor',
  'Synthwave',
  'Steampunk',
  'Cyberpunk',
  'Art Nouveau',
  'Minimalist',
  'Sketch',
  'Comic Book',
  'Manga',
  'Photorealistic',
  'Surreal',
  'Pop Art',
  'Grunge',
  'Neon Noir',
  'Cottagecore',
  'Dark Academia',
  'Live Action',
  'Hollywood',
  'Documentary',
  'Music Video',
  'Commercial',
  'Street Photo',
  'Portrait',
  'Fashion',
  'Realistic',
  'Bauhaus',
  'Sci-Fi',
  'Fantasy',
  'Horror',
  'Western',
  'Apocalyptic',
  'Y2K',
  'Kawaii',
  'Retro',
  'Memphis',
  'Brutalist',
  'Ink Drawing',
];

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const StepIndicator: React.FC<{ currentStep: Step; completedSteps: Set<Step>; onStepClick: (step: Step) => void }> = ({ currentStep, completedSteps, onStepClick }) => {
    const steps: { id: Step; title: string }[] = [
        { id: 'script', title: '1. Kịch bản' },
        { id: 'characters', title: '2. Nhân vật' },
        { id: 'scenes', title: '3. Phân cảnh' },
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


const VeoAnimationGenerator: React.FC<VeoAnimationGeneratorProps> = ({ onGoHome }) => {
  const [currentStep, setCurrentStep] = useState<Step>('script');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  
  const [script, setScript] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(1);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [style, setStyle] = useState<string>('Default');
  const [scriptLanguage, setScriptLanguage] = useState<ScriptLanguage>('Tiếng Việt');
  const [characterNationality, setCharacterNationality] = useState<string>('Default');

  const [characters, setCharacters] = useState<Character[]>([]);
  
  const [generatedScenes, setGeneratedScenes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateAndSetScenes = async (chars: Character[]) => {
    setLoadingMessage('AI đang tạo các phân cảnh chi tiết...');
    const scenes = await generateAnimationScenes(script, chars, durationMinutes, durationSeconds, style, scriptLanguage);
    setGeneratedScenes(scenes);
    setCompletedSteps(prev => new Set(prev).add('script').add('characters'));
    setCurrentStep('scenes');
  };
  
  const handleAnalyzeCharacters = async () => {
      if (!script.trim()) {
          setError('Vui lòng nhập kịch bản.');
          return;
      }
      const totalSecondsValue = durationMinutes * 60 + durationSeconds;
      if (totalSecondsValue <= 0) {
          setError("Tổng thời lượng phải lớn hơn 0.");
          return;
      }
      if (totalSecondsValue > 900) { // 15 minutes * 60 seconds
          setError("Thời lượng video không được vượt quá 15 phút.");
          return;
      }
      setError(null);
      setIsLoading(true);
      setLoadingMessage('AI đang phân tích kịch bản và xác định nhân vật...');
      try {
        const identifiedChars = await identifyCharactersFromScript(script, characterNationality);
        
        if (identifiedChars && identifiedChars.length > 0) {
            setLoadingMessage('Đang dịch mô tả nhân vật...');
            
            const charsWithTranslations = await Promise.all(
                identifiedChars.map(async (char) => {
                    const translatedPrompt = await translateText(char.prompt, 'Vietnamese');
                    return {
                        name: char.name,
                        prompt: char.prompt,
                        promptVietnamese: translatedPrompt,
                    };
                })
            );

            setCharacters(charsWithTranslations);
            setCompletedSteps(prev => new Set(prev).add('script'));
            setCurrentStep('characters');
        } else {
            // No characters found. Skip to scene generation.
            setCharacters([]);
            await generateAndSetScenes([]);
        }
      } catch(err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi phân tích và tạo cảnh.');
      } finally {
        setIsLoading(false);
      }
  }

  const handleGenerateScenes = async () => {
    setError(null);
    setIsLoading(true);
    try {
        await generateAndSetScenes(characters);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi tạo phân cảnh.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep('script');
    setCompletedSteps(new Set());
    setScript('');
    setDurationMinutes(1);
    setDurationSeconds(0);
    setStyle('Default');
    setScriptLanguage('Tiếng Việt');
    setCharacterNationality('Default');
    setCharacters([]);
    setGeneratedScenes([]);
    setIsLoading(false);
    setError(null);
  };

  const handleStepClick = (step: Step) => {
    if(completedSteps.has(step) || step === 'script') {
        setCurrentStep(step);
    }
  };

  const handleCharacterChange = (index: number, field: 'prompt' | 'promptVietnamese', value: string) => {
    setCharacters(prev => {
        const newCharacters = [...prev];
        newCharacters[index] = { ...newCharacters[index], [field]: value };
        return newCharacters;
    });
  };

  const handleDownloadAllPrompts = () => {
    if (generatedScenes.length === 0) return;
    
    const content = generatedScenes.map(scene => scene.detailedVideoPrompt).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `veo_animation_prompts.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'script': {
        const totalSeconds = durationMinutes * 60 + durationSeconds;
        const numberOfScenes = totalSeconds > 0 ? Math.round(totalSeconds / 8) : 0;
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Bước 1: Nhập Kịch Bản & Tùy chọn</h2>
            <p className="text-center text-yellow-400 text-sm -mt-4">
                Lưu ý: Thời lượng video tối đa là 15 phút để đảm bảo hiệu suất và chất lượng tốt nhất.
            </p>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Nhập hoặc dán toàn bộ kịch bản của bạn vào đây..."
              className="w-full h-80 p-4 bg-dark-card border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition-all duration-300 resize-y"
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/50 p-4 rounded-lg">
                <div className="space-y-2">
                    <label htmlFor="duration-minutes" className="block text-md font-medium text-dark-text-secondary">
                      Thời lượng Video
                    </label>
                    <div className="flex items-center space-x-2">
                        <input id="duration-minutes" type="number" value={durationMinutes} onChange={(e) => {
                            let newMinutes = Math.max(0, Number(e.target.value));
                            if (newMinutes > 15) newMinutes = 15;
                            setDurationMinutes(newMinutes);
                            if (newMinutes >= 15) setDurationSeconds(0);
                        }} min="0" max="15" className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple" aria-label="Phút" />
                        <span className="text-dark-text-secondary">phút</span>
                        <input id="duration-seconds" type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(Math.max(0, Math.min(59, Number(e.target.value))))} min="0" max="59" className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Giây" disabled={durationMinutes >= 15} />
                        <span className="text-dark-text-secondary">giây</span>
                    </div>
                    <p id="duration-helper" className="text-xs text-dark-text-secondary mt-1">Dự kiến tạo {numberOfScenes} phân cảnh (8s/cảnh).</p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="style" className="block text-md font-medium text-dark-text-secondary">
                        Phong cách
                    </label>
                    <select
                        id="style"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    >
                        {animationStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="nationality" className="block text-md font-medium text-dark-text-secondary">
                        Quốc tịch nhân vật
                    </label>
                    <select
                        id="nationality"
                        value={characterNationality}
                        onChange={(e) => setCharacterNationality(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    >
                        <option value="Default">Mặc định (AI tự nhận diện)</option>
                        <option value="Châu Âu">Châu Âu</option>
                        <option value="Châu Á">Châu Á</option>
                        <option value="Châu Phi">Châu Phi</option>
                        <option value="Nam Mỹ">Nam Mỹ</option>
                    </select>
                     <p className="text-xs text-dark-text-secondary mt-1">Áp dụng cho tất cả nhân vật trong kịch bản.</p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="language" className="block text-md font-medium text-dark-text-secondary">
                        Ngôn ngữ kịch bản & thoại
                    </label>
                    <select
                        id="language"
                        value={scriptLanguage}
                        onChange={(e) => setScriptLanguage(e.target.value as ScriptLanguage)}
                        className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    >
                        <option value="Tiếng Việt">Thoại Tiếng Việt (Prompt Tiếng Anh)</option>
                        <option value="Tiếng Anh">Thoại & Prompt Tiếng Anh</option>
                        <option value="Không có thoại">Không có thoại (Video câm)</option>
                    </select>
                </div>
              </div>
            <button
              onClick={handleAnalyzeCharacters}
              disabled={isLoading || !script.trim()}
              className="w-full py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 transition-colors"
            >
              Tiếp tục: Phân tích nhân vật
            </button>
          </div>
        );
      }
      case 'characters':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Bước 2: Chỉnh sửa và cố định nhân vật</h2>
            <p className="text-center text-dark-text-secondary">AI đã phân tích kịch bản và tạo mô tả. Bạn có thể chỉnh sửa lại trước khi tạo phân cảnh.</p>
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
                        <label htmlFor={`char-prompt-en-${index}`} className="block text-sm font-medium text-dark-text-secondary mb-1">Prompt gốc (Tiếng Anh - Dùng để tạo video)</label>
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
            <button
              onClick={handleGenerateScenes}
              disabled={isLoading}
              className="w-full py-3 px-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition-colors"
            >
              Tiếp tục: Tạo các phân cảnh
            </button>
          </div>
        );

      case 'scenes':
        return (
          <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Bước 3: Kết Quả Phân Cảnh</h2>
                {generatedScenes.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={handleDownloadAllPrompts}
                            className="inline-flex items-center justify-center py-2 px-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
                        >
                            <DownloadIcon />
                            Tải về toàn bộ Prompts (.txt)
                        </button>
                    </div>
                )}
            </div>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto p-2 rounded-md">
              {generatedScenes.map((scene, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-dark-border">
                  <h3 className="font-bold text-lg text-brand-light-purple mb-2">{scene.sceneName}</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-dark-text-secondary">Sự kiện chính:</strong> {scene.mainEvents}</p>
                    <p><strong className="text-dark-text-secondary">Nhân vật xuất hiện:</strong> {scene.charactersPresent.join(', ')}</p>
                    <div>
                      <strong className="text-dark-text-secondary">Prompt Video chi tiết:</strong>
                      <p className="mt-1 p-2 bg-black/30 rounded text-gray-300 whitespace-pre-wrap">{scene.detailedVideoPrompt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <PageHeader title="Tạo prompt Veo3 hàng loạt" onBack={onGoHome} />
      {isLoading && <Loader message={loadingMessage} />}
      <div className="bg-dark-card p-4 sm:p-8 rounded-xl shadow-2xl border border-dark-border">
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} onStepClick={handleStepClick} />
        {error && (
          <div className="mb-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
          </div>
        )}
        {renderStepContent()}
      </div>
      <div className="text-center mt-8">
        {currentStep !== 'script' && (
             <button onClick={handleStartOver} className="py-2 px-5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Làm lại từ đầu
            </button>
        )}
      </div>
    </div>
  );
};

export default VeoAnimationGenerator;