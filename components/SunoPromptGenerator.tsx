import React, { useState } from 'react';
import PageHeader from './PageHeader';
import Loader from './Loader';
import { generateSunoPrompts } from '../services/geminiService';
import { SunoPrompt } from '../types';

interface SunoPromptGeneratorProps {
  onGoHome: () => void;
}

type InputMode = 'idea' | 'lyrics';

const genres = ['Pop', 'Lofi', 'EDM', 'Rock', 'Trap', 'Acoustic', 'Ballad', 'R&B', 'Hip-Hop', 'Cinematic', 'Country', 'Folk', 'Ambient', 'Classical'];
const moods = ['Vui vẻ', 'Buồn', 'Hào hùng', 'Bí ẩn', 'Căng thẳng', 'Thư giãn', 'Lãng mạn', 'Năng lượng cao', 'Hoài niệm', 'Truyền cảm hứng'];
const vocals = ['Giọng nam', 'Giọng nữ', 'Không lời'];
const languages = ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Nhật', 'Tiếng Hàn'];

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
};

const SunoPromptGenerator: React.FC<SunoPromptGeneratorProps> = ({ onGoHome }) => {
  const [inputMode, setInputMode] = useState<InputMode>('idea');
  const [userInput, setUserInput] = useState('');
  const [genre, setGenre] = useState(genres[0]);
  const [mood, setMood] = useState(moods[0]);
  const [vocal, setVocal] = useState(vocals[0]);
  const [language, setLanguage] = useState(languages[0]);
  const [instruments, setInstruments] = useState('Piano, guitar');
  
  const [results, setResults] = useState<SunoPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerate = async (isRemix: boolean = false) => {
    if (!userInput.trim()) {
      setError('Vui lòng nhập ý tưởng hoặc lời bài hát.');
      return;
    }
    setIsLoading(true);
    setError(null);
    if (!isRemix) {
        setResults([]);
    }

    try {
      const options = { genre, mood, vocals: vocal, language, instruments };
      const generatedPrompts = await generateSunoPrompts(userInput, inputMode, options);
      setResults(generatedPrompts);
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

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <PageHeader title="Tsoft Melody - Trợ lý tạo prompt Suno" onBack={onGoHome} />
      {isLoading && <Loader message="AI đang sáng tác prompt nhạc..." />}
      {error && (
        <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Lỗi! </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* === CỘT TRÁI: ĐIỀU KHIỂN === */}
        <div className="lg:col-span-4">
          <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6 sticky top-8">
            <h2 className="text-2xl font-bold text-white">1. Nhập liệu</h2>
            <div className="space-y-3">
                <div className="flex justify-around bg-gray-900/50 p-1 rounded-lg">
                    <button
                        onClick={() => setInputMode('idea')}
                        className={`w-full py-2 px-3 text-sm font-semibold rounded-md transition-colors ${inputMode === 'idea' ? 'bg-brand-purple text-white' : 'text-dark-text-secondary hover:bg-gray-700'}`}
                    >
                        Tạo lời từ ý tưởng
                    </button>
                    <button
                        onClick={() => setInputMode('lyrics')}
                        className={`w-full py-2 px-3 text-sm font-semibold rounded-md transition-colors ${inputMode === 'lyrics' ? 'bg-brand-purple text-white' : 'text-dark-text-secondary hover:bg-gray-700'}`}
                    >
                        Dùng lời có sẵn
                    </button>
                </div>
                 <textarea
                    id="idea-input"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                        inputMode === 'idea'
                        ? "Nhập ý tưởng bài hát...\nVD: một bài hát buồn về chia tay, EDM hừng hực khí thế, lofi để học bài..."
                        : "Dán toàn bộ lời bài hát của bạn vào đây..."
                    }
                    className="w-full h-36 p-3 bg-gray-900/50 border border-dark-border rounded-lg resize-y focus:ring-2 focus:ring-brand-purple"
                />
            </div>
            
            <h2 className="text-2xl font-bold text-white pt-4 border-t border-dark-border">2. Tùy chỉnh</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label htmlFor="genre-select" className="block text-sm font-medium text-dark-text-secondary mb-1">Thể loại</label>
                  <select id="genre-select" value={genre} onChange={e => setGenre(e.target.value)} className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple">
                      {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="mood-select" className="block text-sm font-medium text-dark-text-secondary mb-1">Cảm xúc</label>
                  <select id="mood-select" value={mood} onChange={e => setMood(e.target.value)} className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple">
                      {moods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="vocal-select" className="block text-sm font-medium text-dark-text-secondary mb-1">Giọng hát</label>
                  <select id="vocal-select" value={vocal} onChange={e => setVocal(e.target.value)} className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple">
                      {vocals.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="language-select" className="block text-sm font-medium text-dark-text-secondary mb-1">Ngôn ngữ</label>
                  <select id="language-select" value={language} onChange={e => setLanguage(e.target.value)} className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple">
                      {languages.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
              </div>
            </div>
            <div>
              <label htmlFor="instruments-input" className="block text-sm font-medium text-dark-text-secondary mb-1">Nhạc cụ chính</label>
              <input id="instruments-input" type="text" value={instruments} onChange={e => setInstruments(e.target.value)} placeholder="VD: Guitar, Piano, Synth" className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple" />
            </div>
            
            <button
                onClick={() => handleGenerate(false)}
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
            >
                Tạo Prompt
            </button>
          </div>
        </div>

        {/* === CỘT PHẢI: KẾT QUẢ === */}
        <div className="lg:col-span-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">3. Kết quả</h2>
                {results.length > 0 && (
                     <button
                        onClick={() => handleGenerate(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2 py-2 px-4 font-semibold text-sm text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:bg-gray-500 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /></svg>
                        Tạo phiên bản khác
                    </button>
                )}
            </div>
            
            <div className="space-y-6">
                {results.length === 0 && !isLoading && (
                    <div className="text-center py-16 px-6 bg-dark-card border-2 border-dashed border-dark-border rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg>
                        <h3 className="mt-2 text-xl font-semibold text-white">Prompt của bạn sẽ xuất hiện ở đây</h3>
                        <p className="mt-1 text-md text-dark-text-secondary">Nhập ý tưởng và bấm "Tạo Prompt" để bắt đầu.</p>
                    </div>
                )}
                
                {results.map((result, index) => (
                    <div key={index} className="bg-dark-card p-4 sm:p-6 rounded-lg border border-dark-border animate-fade-in">
                        <h3 className="text-xl font-semibold text-brand-light-purple mb-3">{index + 1}. {result.title}</h3>
                        
                        {result.lyrics && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-dark-text-secondary mb-1">Lời bài hát</p>
                                <div className="p-3 bg-gray-900/50 rounded-md border border-dark-border/50 max-h-60 overflow-y-auto">
                                    <p className="text-dark-text whitespace-pre-wrap">{result.lyrics}</p>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <p className="text-sm font-medium text-dark-text-secondary mb-1">Prompt đầy đủ (sẵn sàng để sao chép)</p>
                            <div className="relative">
                                <p className="p-3 pr-12 bg-gray-900/50 rounded-md text-sm text-cyan-300 font-mono leading-relaxed">
                                    {result.prompt}
                                </p>
                                <button
                                    onClick={() => handleCopy(result.prompt, `prompt-${index}`)}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-md bg-gray-700 hover:bg-brand-purple transition-colors"
                                    aria-label="Sao chép prompt"
                                >
                                    <CopyIcon isCopied={copiedKey === `prompt-${index}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SunoPromptGenerator;