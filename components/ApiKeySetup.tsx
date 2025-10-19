import React, { useState } from 'react';

interface ApiKeySetupProps {
  onSuccess: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim() === '') {
      setError('Vui lòng nhập API Key.');
      return;
    }
    localStorage.setItem('gemini-api-key', apiKey);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center p-4">
      <div className="w-full max-w-2xl p-8 bg-dark-card rounded-xl shadow-2xl border border-dark-border">
        <h1 className="animated-gradient-text text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-light-purple mb-4 text-center">
          Thiết Lập API Key
        </h1>
        <p className="text-center text-dark-text-secondary mb-8">
          Bạn cần cung cấp API Key Gemini để sử dụng các tính năng của công cụ.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="api-key-input" className="sr-only">
              Gemini API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder="Dán API Key của bạn vào đây"
              autoFocus
              className="w-full p-3 bg-gray-700 border border-dark-border rounded-lg text-center text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition-all"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 px-4 font-bold text-white bg-brand-purple rounded-lg hover:bg-brand-light-purple disabled:bg-gray-500 transition-colors"
          >
            Lưu và Tiếp Tục
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-dark-border text-left">
            <h2 className="text-xl font-bold text-white mb-4">Hướng dẫn lấy API Key</h2>
            <ol className="space-y-3 text-dark-text-secondary list-decimal list-inside">
                <li>
                    Truy cập vào <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-light-purple hover:underline">Google AI Studio</a>.
                </li>
                <li>
                    Đăng nhập bằng tài khoản Google của bạn.
                </li>
                 <li>
                    Nhấp vào nút "<strong>Create API key</strong>" (Tạo khóa API).
                </li>
                <li>
                    Sao chép khóa API vừa được tạo và dán vào ô ở trên.
                </li>
            </ol>
             <p className="text-xs text-gray-500 mt-4">Lưu ý: API Key của bạn sẽ được lưu trữ cục bộ trên trình duyệt này và không được gửi đến bất kỳ máy chủ nào khác.</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
