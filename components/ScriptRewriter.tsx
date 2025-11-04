import React, { useState, useRef, useEffect } from 'react';
import PageHeader from './PageHeader';
import Loader from './Loader';
import { ScriptAnalysisResult } from '../types';
import { analyzeAndRewriteScript } from '../services/geminiService';

interface ScriptRewriterProps {
    onGoHome: () => void;
}

const InfoCard: React.FC<{ title: string, value: string | number, icon: React.ReactElement }> = ({ title, value, icon }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg flex items-center">
        <div className="p-3 rounded-full bg-brand-purple/20 mr-4 text-brand-light-purple">
            {icon}
        </div>
        <div>
            <p className="text-sm text-dark-text-secondary">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const tones = [
    "Người kể chuyện (Giọng kể lôi cuốn, có cảm xúc)",
    "Chuyên gia Phân tích (Giọng khách quan, chuyên sâu, logic)",
    "Nhà báo Điều tra (Giọng tường thuật, tập trung vào sự thật)",
    "Bình luận viên Hài hước (Giọng dí dỏm, châm biếm, giải trí)",
    "Reviewer Công nghệ (Giọng hiện đại, đánh giá ưu/nhược điểm)",
    "Giáo viên Thân thiện (Giọng giảng giải, dễ hiểu, gần gũi)"
];

const languages = [
    'Vietnamese', 'English', 'Chinese (Mandarin)', 'Spanish', 'Arabic', 'French', 'Hindi', 'Portuguese', 'Japanese', 'Korean'
];


const FileUploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


const ScriptRewriter: React.FC<ScriptRewriterProps> = ({ onGoHome }) => {
    const [script, setScript] = useState('');
    const [tone, setTone] = useState<string>(tones[0]);
    const [language, setLanguage] = useState<string>(languages[0]);
    const [targetDurationMinutes, setTargetDurationMinutes] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ScriptAnalysisResult | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [rewrittenWordCount, setRewrittenWordCount] = useState(0);
    const [rewrittenCharCount, setRewrittenCharCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const calculateStats = (text: string) => {
            const chars = text.length;
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            setCharCount(chars);
            setWordCount(words === 1 && text.trim() === '' ? 0 : words);
        };
        calculateStats(script);
    }, [script]);

    useEffect(() => {
        if (result?.rewrittenScript) {
            const scriptText = result.rewrittenScript;
            const chars = scriptText.length;
            const words = scriptText.trim().split(/\s+/).filter(Boolean).length;
            setRewrittenCharCount(chars);
            setRewrittenWordCount(words);
        }
    }, [result]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setScript(text);
            };
            reader.readAsText(file);
            setError(null);
        } else {
            setError("Vui lòng tải lên một tệp .txt hợp lệ.");
        }
    };


    const handleGenerate = async () => {
        if (!script.trim()) {
            setError('Vui lòng nhập kịch bản cần phân tích và viết lại.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const duration = Number(targetDurationMinutes);
            const analysisResult = await analyzeAndRewriteScript(script, tone, duration > 0 ? duration : 0, language);
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartOver = () => {
        setScript('');
        setTone(tones[0]);
        setLanguage(languages[0]);
        setTargetDurationMinutes('');
        setResult(null);
        setError(null);
        setIsLoading(false);
    };

    const handleCopyScript = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.rewrittenScript).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const handleDownloadScript = () => {
        if (!result) return;
        const blob = new Blob([result.rewrittenScript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeFileName = tone.split(' (')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `rewritten_script_${safeFileName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <PageHeader title="Viết lại kịch bản đối thủ" onBack={onGoHome} />

            {isLoading && <Loader message="AI đang phân tích và sáng tạo... Quá trình này có thể mất một lúc." />}

            {error && (
                <div className="my-4 text-center bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Lỗi! </strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
                </div>
            )}

            {!result ? (
                <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-6">
                    <h2 className="text-2xl font-bold text-white">Bước 1: Nhập kịch bản & Chọn tùy chọn</h2>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label htmlFor="script-input" className="block text-md font-medium text-dark-text-secondary">Kịch bản gốc</label>
                             <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center text-sm py-1 px-3 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                             >
                                 <FileUploadIcon /> Tải lên .txt
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />
                        </div>
                        <textarea
                            id="script-input"
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="Dán kịch bản của đối thủ vào đây..."
                            className="w-full h-80 p-4 bg-gray-900/50 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition-all duration-300 resize-y"
                        />
                         <div className="text-right text-sm text-dark-text-secondary mt-2">
                           Số từ: {wordCount} | Số ký tự: {charCount}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div>
                            <label htmlFor="tone-select" className="block text-md font-medium text-dark-text-secondary mb-2">Giọng điệu viết lại</label>
                            <select
                                id="tone-select"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full p-3 bg-gray-900/50 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple"
                            >
                                {tones.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="language-select" className="block text-md font-medium text-dark-text-secondary mb-2">Ngôn ngữ đầu ra</label>
                            <select
                                id="language-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full p-3 bg-gray-900/50 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple"
                            >
                                {languages.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="duration-input" className="block text-md font-medium text-dark-text-secondary mb-2">Thời lượng kịch bản (phút)</label>
                            <input
                                id="duration-input"
                                type="number"
                                value={targetDurationMinutes}
                                onChange={(e) => setTargetDurationMinutes(e.target.value)}
                                placeholder="Để trống để AI tự quyết định"
                                className="w-full p-3 bg-gray-900/50 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple"
                                min="0"
                            />
                            <p className="text-xs text-dark-text-secondary mt-1">Ước tính 1 phút ≈ 1000 ký tự.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !script.trim()}
                        className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                    >
                        Phân tích & Viết lại
                    </button>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Analysis Section */}
                    <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                        <h2 className="text-2xl font-bold text-white mb-4">Báo cáo phân tích</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-dark-text-secondary mb-3 text-center">Kịch bản gốc</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard title="Số từ" value={result.analysis.wordCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                                    <InfoCard title="Số ký tự" value={result.analysis.charCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-5H4" /></svg>} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-dark-text-secondary mb-3 text-center">Kịch bản viết lại</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoCard title="Số từ" value={rewrittenWordCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                                    <InfoCard title="Số ký tự" value={rewrittenCharCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-5H4" /></svg>} />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-brand-light-purple mb-3">Kiểm tra chính sách</h3>
                        <div className="space-y-3 text-sm">
                            <p><strong className="text-dark-text">Rủi ro Reuse Content:</strong> <span className="text-dark-text-secondary">{result.analysis.policyCheck.reuseRisk}</span></p>
                            <p><strong className="text-dark-text">Ghi chú Fair Use:</strong> <span className="text-dark-text-secondary">{result.analysis.policyCheck.fairUseNotes}</span></p>
                            <p><strong className="text-dark-text">Từ ngữ bị cấm:</strong> <span className="text-dark-text-secondary">{result.analysis.policyCheck.forbiddenWordsFound.length > 0 ? result.analysis.policyCheck.forbiddenWordsFound.join(', ') : 'Không tìm thấy'}</span></p>
                        </div>
                    </div>

                    {/* Character and Story Structure Section */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                            <h2 className="text-2xl font-bold text-white mb-4">Nhân vật</h2>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {result.characters.map((char, index) => (
                                    <div key={index} className="bg-gray-900/50 p-3 rounded-md">
                                        <p className="font-bold text-white">{char.name} <span className="text-xs font-normal bg-brand-purple/50 text-brand-light-purple px-2 py-0.5 rounded-full ml-2">{char.role}</span></p>
                                        <p className="text-sm text-dark-text-secondary">{char.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                            <h2 className="text-2xl font-bold text-white mb-4">Cấu trúc 3 hồi</h2>
                             <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
                                <p><strong className="text-dark-text">Hồi 1 (Mở đầu):</strong> <span className="text-dark-text-secondary">{result.threeActStructure.act1_setup}</span></p>
                                <p><strong className="text-dark-text">Hồi 2 (Cao trào):</strong> <span className="text-dark-text-secondary">{result.threeActStructure.act2_confrontation}</span></p>
                                <p><strong className="text-dark-text">Hồi 3 (Kết):</strong> <span className="text-dark-text-secondary">{result.threeActStructure.act3_resolution}</span></p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Rewritten Script Section */}
                    <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                        <h2 className="text-2xl font-bold text-white mb-4">Kịch bản đã viết lại (Giọng điệu: {tone.split(' (')[0]})</h2>
                        <textarea
                            readOnly
                            value={result.rewrittenScript}
                            className="w-full h-96 p-4 bg-gray-900/50 border border-dark-border rounded-lg resize-y"
                        />
                        <div className="mt-4 flex flex-col sm:flex-row gap-4">
                            <button onClick={handleCopyScript} className="flex-1 flex items-center justify-center py-2 px-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                                {isCopied ? "Đã sao chép!" : "Sao chép kịch bản"}
                            </button>
                             <button onClick={handleDownloadScript} className="flex-1 flex items-center justify-center py-2 px-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                Tải về (.txt)
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <button onClick={handleStartOver} className="py-2 px-5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            Viết lại kịch bản khác
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScriptRewriter;