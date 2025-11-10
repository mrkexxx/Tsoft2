import React, { useState } from 'react';

interface PasswordProtectionProps {
  onSuccess: () => void;
  onClose: () => void;
  passwordToMatch: string;
  sessionKey: string;
  title: string;
  description: string;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ 
  onSuccess, 
  onClose, 
  passwordToMatch, 
  sessionKey,
  title,
  description 
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === passwordToMatch) {
      sessionStorage.setItem(sessionKey, 'true');
      onSuccess();
    } else {
      setError('Mật khẩu không đúng. Vui lòng thử lại.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-bg bg-opacity-95 flex items-center justify-center z-50 animate-fade-in">
      <div className="w-full max-w-sm p-8 bg-dark-card rounded-xl shadow-2xl border border-dark-border relative">
        <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 text-dark-text-secondary hover:text-white transition-colors rounded-full"
            aria-label="Đóng"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-2">{title}</h2>
        <p className="text-center text-dark-text-secondary mb-6">{description}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password-input" className="sr-only">
              Mật khẩu
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
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
            Xác nhận
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordProtection;