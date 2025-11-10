import React from 'react';

interface OptionsPanelProps {
  durationMinutes: number;
  setDurationMinutes: (duration: number) => void;
  durationSeconds: number;
  setDurationSeconds: (duration: number) => void;
  promptInterval: number;
  setPromptInterval: (interval: number) => void;
  style: string;
  setStyle: (style: string) => void;
  onGeneratePrompts: () => void;
  isLoadingPrompts: boolean;
  scriptIsEmpty: boolean;
  disabled?: boolean;
}

const imageStyles = [
  'Default',
  'Điện ảnh (Cinematic)',
  'Hoạt hình (Animation)',
  'Tranh vẽ thuỷ mặc',
  'Vibe cổ họa Việt Nam',
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

const LightningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);


const OptionsPanel: React.FC<OptionsPanelProps> = ({
  durationMinutes,
  setDurationMinutes,
  durationSeconds,
  setDurationSeconds,
  promptInterval,
  setPromptInterval,
  style,
  setStyle,
  onGeneratePrompts,
  isLoadingPrompts,
  scriptIsEmpty,
  disabled = false,
}) => {
  const totalSeconds = durationMinutes * 60 + durationSeconds;
  const numberOfImages = totalSeconds > 0 ? Math.round(totalSeconds / promptInterval) : 0;
  const isAnyLoading = isLoadingPrompts;

  return (
    <div className="space-y-6 bg-dark-card p-6 rounded-lg border border-dark-border">
      <h3 className="text-xl font-bold text-center text-white">Bước 1: Tùy chọn</h3>
      
      <div className="space-y-2">
        <label htmlFor="duration-minutes" className="block text-md font-medium text-dark-text-secondary">
          Thời lượng kịch bản
        </label>
        <div className="flex items-center space-x-2">
            <input
                id="duration-minutes"
                type="number"
                value={durationMinutes}
                onChange={(e) => {
                    const value = Math.max(0, Number(e.target.value));
                    setDurationMinutes(value);
                }}
                min="0"
                className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple disabled:opacity-50"
                aria-label="Phút"
                disabled={disabled}
            />
            <span className="text-dark-text-secondary">phút</span>
            <input
                id="duration-seconds"
                type="number"
                value={durationSeconds}
                onChange={(e) => {
                    let value = Math.max(0, Number(e.target.value));
                    if (value >= 60) value = 59;
                    setDurationSeconds(value);
                }}
                min="0"
                max="59"
                className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple disabled:opacity-50"
                aria-label="Giây"
                disabled={disabled}
            />
            <span className="text-dark-text-secondary">giây</span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="prompt-interval" className="block text-md font-medium text-dark-text-secondary">
          Tần suất Prompt
        </label>
        <select
          id="prompt-interval"
          value={promptInterval}
          onChange={(e) => setPromptInterval(Number(e.target.value))}
          className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple disabled:opacity-50"
          disabled={disabled}
        >
          <option value={3}>Nhanh (3 giây / prompt)</option>
          <option value={5}>Tiêu chuẩn (5 giây / prompt)</option>
          <option value={10}>Chi tiết (10 giây / prompt)</option>
        </select>
         <p id="duration-helper" className="text-xs text-dark-text-secondary mt-1">Dự kiến tạo {numberOfImages} prompt.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="style" className="block text-md font-medium text-dark-text-secondary">
          Phong cách
        </label>
        <select
          id="style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-dark-border rounded-md focus:ring-2 focus:ring-brand-purple focus:border-brand-purple disabled:opacity-50"
          disabled={disabled}
        >
          {imageStyles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col space-y-3 pt-4 border-t border-dark-border">
        <button
          onClick={onGeneratePrompts}
          disabled={isAnyLoading || scriptIsEmpty || disabled}
          className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          {isLoadingPrompts ? (
             <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tạo prompt...
            </>
          ) : (
             <>
                <LightningIcon />
                Tạo Prompt
             </>
          )}
        </button>
      </div>

      {scriptIsEmpty && !isAnyLoading && <p className="text-center text-sm text-yellow-400 mt-2">Vui lòng nhập ý tưởng kịch bản.</p>}
    </div>
  );
};

export default OptionsPanel;