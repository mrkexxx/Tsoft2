
import React from 'react';

interface HeaderProps {
    onGoHome: () => void;
    onNavigateToHistory: () => void;
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


const Header: React.FC<HeaderProps> = ({ onGoHome, onNavigateToHistory }) => {
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
            </nav>
        </div>
    </header>
  );
};

export default Header;
