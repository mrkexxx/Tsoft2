
import React from 'react';

interface HeaderProps {
    onGoHome: () => void;
    onNavigateToHistory: () => void;
    onNavigateToApiKeySetup: () => void;
}

const HomeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const HistoryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ApiKeyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ onGoHome, onNavigateToHistory, onNavigateToApiKeySetup }) => {
  return (
    <header className="py-4 border-b border-dark-border">
        <div className="container mx-auto px-4 md:px-8">
            <nav className="flex items-center gap-6">
                <button 
                    onClick={onGoHome}
                    className="flex items-center gap-2 text-dark-text-secondary hover:text-white transition-colors duration-300"
                    aria-label="Trang chủ"
                >
                    <HomeIcon />
                    <span className="font-semibold text-lg">Trang chủ</span>
                </button>
                <button 
                    onClick={onNavigateToHistory}
                    className="flex items-center gap-2 text-dark-text-secondary hover:text-white transition-colors duration-300"
                    aria-label="Thư viện"
                >
                    <HistoryIcon />
                    <span className="font-semibold text-lg">Thư viện</span>
                </button>
                <button 
                    onClick={onNavigateToApiKeySetup}
                    className="flex items-center gap-2 text-dark-text-secondary hover:text-white transition-colors duration-300"
                    aria-label="Thiết lập API Key"
                >
                    <ApiKeyIcon />
                    <span className="font-semibold text-lg">Thiết lập API Key</span>
                </button>
            </nav>
        </div>
    </header>
  );
};

export default Header;