import React from 'react';

interface HomePageProps {
  onNavigateToScriptToImage: () => void;
  onNavigateToVeoAnimation: () => void;
  onNavigateToThumbnailGenerator: () => void;
  onNavigateToYouTubeSeo: () => void;
  onNavigateToVideoAnalyzer: () => void;
}

// FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const ToolCard: React.FC<{ title: string; description: string; icon: React.ReactElement; onClick: () => void; }> = ({ title, description, icon, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-dark-card p-8 rounded-xl border border-dark-border hover:border-brand-purple/50 transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col"
        >
            <div className="absolute -inset-px bg-gradient-to-r from-purple-700 to-brand-light-purple rounded-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 blur-lg" aria-hidden="true"></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="bg-brand-purple/20 p-4 rounded-lg text-brand-light-purple inline-block mb-6 self-start">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                <p className="text-dark-text-secondary mb-6 flex-grow">{description}</p>
                <div className="flex items-center text-brand-light-purple font-semibold mt-auto">
                    <span>Bắt đầu</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

const CommunityLink: React.FC<{ title: string; description: string; href: string; icon: React.ReactElement; }> = ({ title, description, href, icon }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-dark-card p-6 rounded-xl border border-dark-border hover:border-brand-light-purple/50 transition-all duration-300"
    >
        <div className="flex items-center">
            <div className="flex-shrink-0 mr-4">
                 {icon}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-lg text-white">{title}</h4>
                <p className="text-sm text-dark-text-secondary">{description}</p>
            </div>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-dark-text-secondary transform group-hover:translate-x-1 group-hover:text-white transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
        </div>
    </a>
);


const HomePage: React.FC<HomePageProps> = ({ onNavigateToScriptToImage, onNavigateToVeoAnimation, onNavigateToThumbnailGenerator, onNavigateToYouTubeSeo, onNavigateToVideoAnalyzer }) => {
    const defaultCommunityIcon = (
        <div className="bg-brand-purple/20 p-3 rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-light-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        </div>
    );
    
    const communityLinks = [
        {
            title: "TifoShop - Shop tài nguyên MMO",
            description: "Cộng đồng mua bán, trao đổi tài nguyên cho dân MMO.",
            href: "https://zalo.me/g/vskind805",
            icon: defaultCommunityIcon
        },
        {
            title: "Hỗ trợ tool VEO3",
            description: "Group hỗ trợ chính thức cho công cụ tạo video hàng loạt VEO3.",
            href: "https://zalo.me/g/qnkofg173",
            icon: <img src="https://sf-static.upanhlaylink.com/img/image_202510216ca3829c10658dd7661449e675a09f05.jpg" alt="Hỗ trợ tool VEO3 logo" className="h-12 w-12 rounded-lg object-cover" />
        },
        {
            title: "Cộng đồng Youtube Tấn Văn",
            description: "Cùng học hỏi, chia sẻ kinh nghiệm xây dựng kênh Youtube.",
            href: "https://zalo.me/g/tdhnzw234",
            icon: defaultCommunityIcon
        },
        {
            title: "GoSpeedUp - Tiktok Affiliate",
            description: "Trao đổi kiến thức, kinh nghiệm làm Tiktok Affiliate.",
            href: "https://zalo.me/g/qepmvz949",
            icon: defaultCommunityIcon
        }
    ];

  return (
    <div className="animate-fade-in">
        <section className="text-center py-16 md:py-20">
            <h1 className="animated-gradient-text text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-brand-light-purple mb-6 max-w-4xl mx-auto leading-tight">
                Tsoft 2 - Tool tạo prompt video veo3 hàng loạt
            </h1>
            <h2 className="text-lg md:text-xl text-dark-text-secondary max-w-3xl mx-auto mb-12">
                Đồng nhất nhân vật và ảnh minh hoạ bám theo kịch bản storyboard
            </h2>
        </section>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ToolCard 
            title="Tạo hình ảnh theo kịch bản"
            description="Tải lên kịch bản của bạn để tự động tạo prompt và hình ảnh minh họa cho từng phân cảnh."
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            }
            onClick={onNavigateToScriptToImage}
        />
        <ToolCard 
            title="Tạo prompt Veo3 hàng loạt"
            description="Xác định nhân vật và kịch bản để tạo prompt video chi tiết, đảm bảo tính nhất quán cho phim hoạt hình."
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            }
            onClick={onNavigateToVeoAnimation}
        />
         <ToolCard 
            title="Tạo Thumbnail theo ảnh mẫu"
            description="Tải lên một ảnh thumbnail, AI sẽ phân tích và tạo ra prompt để bạn có thể tạo các ảnh tương tự."
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            }
            onClick={onNavigateToThumbnailGenerator}
        />
        <ToolCard 
            title="Viết tiêu đề chuẩn SEO Youtube"
            description="Cung cấp tên kênh và nội dung video, AI sẽ tạo tiêu đề, mô tả, hashtag và từ khóa tối ưu cho VidIQ."
            icon={
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            }
            onClick={onNavigateToYouTubeSeo}
        />
        <ToolCard 
            title="Phân tích Video bằng AI"
            description="Tải lên video để AI phân tích nội dung, xác định các phân cảnh chính và tạo prompt video."
            icon={
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            }
            onClick={onNavigateToVideoAnalyzer}
        />
      </div>

       <section className="mt-24 max-w-4xl mx-auto">
        <h2 className="animated-gradient-text text-3xl md:text-4xl font-bold text-center mb-10 text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-brand-light-purple">
          Giới thiệu Tsoft – Tool tạo video hàng loạt VEO3 Ultra mới nhất 2025
        </h2>
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-dark-border">
          <iframe 
            className="w-full h-full" 
            src="https://www.youtube.com/embed/GuSWkV-T8WI?si=zw0P4al4gT9694ih" 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen>
          </iframe>
        </div>
      </section>

      <section className="mt-24 max-w-5xl mx-auto">
            <h2 className="animated-gradient-text text-3xl md:text-4xl font-bold text-center mb-10 text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-brand-light-purple">
              Tham Gia Cộng Đồng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {communityLinks.map((link, index) => (
                    <CommunityLink key={index} title={link.title} description={link.description} href={link.href} icon={link.icon} />
                ))}
            </div>
        </section>
    </div>
  );
};

export default HomePage;
