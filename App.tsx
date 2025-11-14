import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ScriptToImageGenerator from './components/ScriptToImageGenerator';
import VeoAnimationGenerator from './components/VeoAnimationGenerator';
import HistoryPage from './components/HistoryPage';
import ArticleViewer from './components/ArticleViewer';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import YouTubeSeoGenerator from './components/YouTubeSeoGenerator';
import ApiKeySetup from './components/ApiKeySetup';
import { Article } from './types';
import InfoPopup from './components/InfoPopup';
import Chatbot from './components/Chatbot';
import VideoAnalyzer from './components/VideoAnalyzer';
import ScriptRewriter from './components/ScriptRewriter';
import PasswordProtection from './components/PasswordProtection';
import SunoPromptGenerator from './components/SunoPromptGenerator';
import TemporaryLockPopup from './components/TemporaryLockPopup';

type Page = 'home' | 'scriptToImage' | 'veoAnimation' | 'history' | 'articleDetail' | 'thumbnailGenerator' | 'youtubeSeo' | 'apiKeySetup' | 'videoAnalyzer' | 'scriptRewriter' | 'sunoPromptGenerator';

const App: React.FC = () => {
  const [isLocked] = useState<boolean>(true);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showInfoPopup, setShowInfoPopup] = useState<boolean>(false);
  const [showVipPopup, setShowVipPopup] = useState<boolean>(false);
  const [showSunoPopup, setShowSunoPopup] = useState<boolean>(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
      setHasApiKey(true);
    }
    
    const popupShown = sessionStorage.getItem('infoPopupShown');
    if (!popupShown) {
      setShowInfoPopup(true);
      sessionStorage.setItem('infoPopupShown', 'true');
    }
  }, []);

  const handleApiKeySuccess = () => {
    setHasApiKey(true);
    setCurrentPage('home');
  };

  const navigateToArticleDetail = (article: Article) => {
    setSelectedArticle(article);
    setCurrentPage('articleDetail');
  };

  const navigateToScriptToImage = () => {
    setCurrentPage('scriptToImage');
    setSelectedArticle(null);
  };

  const navigateToVeoAnimation = () => {
    setCurrentPage('veoAnimation');
    setSelectedArticle(null);
  };
  
  const navigateToThumbnailGenerator = () => {
    setCurrentPage('thumbnailGenerator');
    setSelectedArticle(null);
  };

  const navigateToYouTubeSeo = () => {
    setCurrentPage('youtubeSeo');
    setSelectedArticle(null);
  };

  const navigateToVideoAnalyzer = () => {
    setCurrentPage('videoAnalyzer');
    setSelectedArticle(null);
  };

  const navigateToSunoPromptGenerator = () => {
    if (sessionStorage.getItem('sunoAccessGranted') === 'true') {
        setCurrentPage('sunoPromptGenerator');
        setSelectedArticle(null);
    } else {
        setShowSunoPopup(true);
    }
  };

  const navigateToScriptRewriter = () => {
    if (sessionStorage.getItem('vipAccessGranted') === 'true') {
        setCurrentPage('scriptRewriter');
        setSelectedArticle(null);
    } else {
        setShowVipPopup(true);
    }
  };

  const navigateHome = () => {
    setCurrentPage('home');
    setSelectedArticle(null);
  };

  const navigateToHistory = () => {
    setCurrentPage('history');
    setSelectedArticle(null);
  };

  const navigateToApiKeySetup = () => {
    setCurrentPage('apiKeySetup');
    setSelectedArticle(null);
  };

  const handleVipSuccess = () => {
    setShowVipPopup(false);
    setCurrentPage('scriptRewriter');
    setSelectedArticle(null);
  };
  
  const handleSunoSuccess = () => {
    setShowSunoPopup(false);
    setCurrentPage('sunoPromptGenerator');
    setSelectedArticle(null);
  };

  if (!hasApiKey) {
    return (
        <>
            {isLocked && <TemporaryLockPopup />}
            <ApiKeySetup onSuccess={handleApiKeySuccess} />
        </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
        case 'home':
            return <HomePage onNavigateToScriptToImage={navigateToScriptToImage} onNavigateToVeoAnimation={navigateToVeoAnimation} onNavigateToThumbnailGenerator={navigateToThumbnailGenerator} onNavigateToYouTubeSeo={navigateToYouTubeSeo} onNavigateToVideoAnalyzer={navigateToVideoAnalyzer} onNavigateToScriptRewriter={navigateToScriptRewriter} onNavigateToSunoPromptGenerator={navigateToSunoPromptGenerator} />;
        case 'scriptToImage':
            return <ScriptToImageGenerator onGoHome={navigateHome} />;
        case 'veoAnimation':
            return <VeoAnimationGenerator onGoHome={navigateHome} />;
        case 'thumbnailGenerator':
            return <ThumbnailGenerator onGoHome={navigateHome} />;
        case 'youtubeSeo':
            return <YouTubeSeoGenerator onGoHome={navigateHome} />;
        case 'videoAnalyzer':
            return <VideoAnalyzer onGoHome={navigateHome} />;
        case 'sunoPromptGenerator':
            return <SunoPromptGenerator onGoHome={navigateHome} />;
        case 'scriptRewriter':
            return <ScriptRewriter onGoHome={navigateHome} />;
        case 'history':
            return <HistoryPage onGoHome={navigateHome} onNavigateToArticle={navigateToArticleDetail} />;
        case 'articleDetail':
            if (!selectedArticle) {
                // Fallback to history page if no article is selected
                return <HistoryPage onGoHome={navigateHome} onNavigateToArticle={navigateToArticleDetail} />;
            }
            return <ArticleViewer article={selectedArticle} onBack={navigateToHistory} />;
        case 'apiKeySetup':
            return <ApiKeySetup onSuccess={handleApiKeySuccess} />;
        default:
            return <HomePage onNavigateToScriptToImage={navigateToScriptToImage} onNavigateToVeoAnimation={navigateToVeoAnimation} onNavigateToThumbnailGenerator={navigateToThumbnailGenerator} onNavigateToYouTubeSeo={navigateToYouTubeSeo} onNavigateToVideoAnalyzer={navigateToVideoAnalyzer} onNavigateToScriptRewriter={navigateToScriptRewriter} onNavigateToSunoPromptGenerator={navigateToSunoPromptGenerator} />;
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {isLocked && <TemporaryLockPopup />}
      {showInfoPopup && <InfoPopup onClose={() => setShowInfoPopup(false)} />}
      {showVipPopup && <PasswordProtection 
        onSuccess={handleVipSuccess} 
        onClose={() => setShowVipPopup(false)} 
        passwordToMatch="123@"
        sessionKey="vipAccessGranted"
        title="Yêu cầu quyền truy cập VIP"
        description="Tính năng này dành riêng cho khách hàng VIP."
      />}
      {showSunoPopup && <PasswordProtection 
        onSuccess={handleSunoSuccess} 
        onClose={() => setShowSunoPopup(false)} 
        passwordToMatch="123#"
        sessionKey="sunoAccessGranted"
        title="Truy cập Tsoft Melody (VIP)"
        description="Tính năng này dành riêng cho khách hàng VIP và yêu cầu mật khẩu."
      />}
      <Header onGoHome={navigateHome} onNavigateToHistory={navigateToHistory} onNavigateToApiKeySetup={navigateToApiKeySetup} />
      <main className="container mx-auto p-4 md:p-8">
        {renderPage()}
      </main>
      <footer className="text-center py-4 mt-8 border-t border-dark-border">
          <p className="text-sm text-dark-text-secondary">&copy; 2025 All rights reserved. được phát triển bởi Arsène Lupin - Hotline 037 28 99999.</p>
      </footer>
      <Chatbot />
    </div>
  );
};

export default App;
