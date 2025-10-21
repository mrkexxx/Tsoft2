import React from 'react';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
}

const BackIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack }) => {
  return (
    <div className="relative flex items-center justify-center mb-8 md:mb-12">
      <button 
        onClick={onBack} 
        className="absolute left-0 flex items-center gap-2 text-dark-text-secondary hover:text-white transition-colors duration-300 font-semibold py-2 px-4 rounded-lg hover:bg-dark-card"
        aria-label="Quay lại Trang chủ"
      >
        <BackIcon />
        <span className="hidden sm:inline">Trang chủ</span>
      </button>
      <h1 className="animated-gradient-text text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-brand-light-purple text-center px-16">
        {title}
      </h1>
    </div>
  );
};

export default PageHeader;
