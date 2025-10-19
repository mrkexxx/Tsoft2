
import React, { useRef } from 'react';

interface ScriptInputProps {
  script: string;
  setScript: (script: string) => void;
  fileName: string | null;
  setFileName: (name: string | null) => void;
}

const FileUploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


const ScriptInput: React.FC<ScriptInputProps> = ({ script, setScript, fileName, setFileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setScript(text);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col space-y-4">
      <label htmlFor="script-input" className="text-lg font-semibold text-dark-text">
        Kịch bản
      </label>
      <textarea
        id="script-input"
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Nhập hoặc dán kịch bản của bạn vào đây..."
        className="w-full h-64 p-4 bg-dark-card border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition-all duration-300 resize-none"
      />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <input
          type="file"
          accept=".txt,.md,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          onClick={handleButtonClick}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:bg-gray-700 hover:border-brand-light-purple transition-colors duration-300"
        >
          <FileUploadIcon />
          <span>Tải lên tệp kịch bản</span>
        </button>
        {fileName && <p className="text-sm text-dark-text-secondary truncate">Tệp đã tải: {fileName}</p>}
      </div>
    </div>
  );
};

export default ScriptInput;
