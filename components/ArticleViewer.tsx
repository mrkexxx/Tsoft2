
import React from 'react';
import type { Article } from '../types';

interface ArticleViewerProps {
  article: Article;
  onBack: () => void;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ article, onBack }) => {

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="mb-8">
            <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-dark-text-secondary hover:text-white transition-colors duration-300 font-semibold py-2 px-4 rounded-lg hover:bg-dark-card"
            aria-label="Quay lại Thư viện"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Quay lại Thư viện</span>
            </button>
        </div>

        <article>
            <header className="mb-8 border-b border-dark-border pb-6">
                <div className="flex flex-wrap gap-3 mb-4">
                    {article.tags.map(tag => (
                    <span key={tag} className="text-sm font-semibold bg-brand-purple/20 text-brand-light-purple px-4 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
            <h1 id="article-viewer-title" className="animated-gradient-text text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-brand-light-purple">
                {article.title}
            </h1>
            </header>

            <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-auto max-h-[500px] object-cover rounded-xl my-8 shadow-2xl border border-dark-border"
            />

            <div className="article-content">
            <style>{`
                .article-content h2 { font-size: 1.75rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; color: #fff; border-bottom: 1px solid #374151; padding-bottom: 0.5rem; }
                .article-content h3 { font-size: 1.5rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #d1d5db; }
                .article-content p { margin-bottom: 1.25rem; line-height: 1.7; color: #9ca3af; }
                .article-content strong { color: #d1d5db; }
                .article-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.25rem; color: #9ca3af; }
                .article-content ul ul { list-style-type: circle; margin-top: 0.5rem; margin-left: 1rem;}
                .article-content li { margin-bottom: 0.5rem; }
            `}</style>
            {article.content}
            </div>
        </article>
    </div>
  );
};

export default ArticleViewer;
