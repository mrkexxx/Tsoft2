import React from 'react';

interface RewrittenScriptEditorProps {
  script: string;
  setScript: (script: string) => void;
  onGeneratePrompts: () => void;
  isLoading: boolean;
  onStartOver: () => void;
}

const GenerateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const RewrittenScriptEditor: React.FC<RewrittenScriptEditorProps> = ({
  script,
  setScript,
  onGeneratePrompts,
  isLoading,
  onStartOver,
}) => {
  return (
    <div className="mt-8 bg-dark-card p-6 rounded-lg border border-dark-border animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Bước 2: Chỉnh sửa kịch bản</h2>
        <button 
          onClick={onStartOver}
          className="py-2 px-4 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
            Làm lại từ đầu
        </button>
      </div>
      <p className="text-dark-text-secondary mb-4">
        AI đã viết lại kịch bản của bạn cho phù hợp với thời lượng đã chọn. Bạn có thể chỉnh sửa nội dung dưới đây trước khi tạo prompt.
      </p>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        className="w-full h-96 p-4 bg-gray-900/50 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition-all duration-300 resize-y"
        placeholder="Kịch bản được viết lại sẽ xuất hiện ở đây..."
      />
      <button
        onClick={onGeneratePrompts}
        disabled={isLoading || !script.trim()}
        className="w-full mt-4 flex items-center justify-center py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tạo prompt...
          </>
        ) : (
          <>
            <GenerateIcon />
            Tạo Prompt từ kịch bản này
          </>
        )}
      </button>
    </div>
  );
};

export default RewrittenScriptEditor;
