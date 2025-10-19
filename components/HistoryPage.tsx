
import React from 'react';
import type { Article } from '../types';

interface LibraryPageProps {
  onGoHome: () => void;
  onNavigateToArticle: (article: Article) => void;
}

const newArticleContent = (
    <>
        <h2>Giai đoạn chuẩn bị</h2>
        <p>Khi tạo kênh hoàn chỉnh → bắt đầu giai đoạn ngâm kênh.</p>
        <p><strong>Thời gian ngâm:</strong> 7 ngày</p>
        <p>Sau khi ngâm đủ, tiến hành đăng video chính thức.</p>
        
        <h3>Nguyên tắc ngâm:</h3>
        <ul>
            <li><strong>Ngày 1:</strong> 3 video</li>
            <li><strong>Ngày 2-3:</strong> 3 video/ngày</li>
            <li><strong>Ngày 4-7:</strong> 4–6 video/ngày</li>
        </ul>
        
        <h2>🗓 Chi tiết từng ngày</h2>
        
        <h3>Ngày 1 → Ngày 3</h3>
        <ul>
            <li><strong>Video:</strong> 3 video/ngày</li>
            <li><strong>Thao tác:</strong>
                <ul>
                    <li>Xem mỗi video 5 phút</li>
                    <li>Sau đó Like 👍, Bình luận 💬, Share ↗️</li>
                    <li>Không quá 5 bình luận/ngày</li>
                    <li>Mỗi ngày dành 15–30 phút để thao tác</li>
                </ul>
            </li>
        </ul>

        <h3>Ngày 4 → Ngày 7</h3>
        <ul>
            <li><strong>Video:</strong> 5 video/ngày</li>
            <li><strong>Thao tác Video:</strong>
                <ul>
                    <li>Xem mỗi video 5 phút</li>
                    <li>Like 👍, Bình luận 💬, Share ↗️, Đăng ký 🔔</li>
                    <li>Không quá 10 bình luận/ngày</li>
                    <li>Không đăng ký quá 5 kênh/ngày</li>
                    <li>Mỗi ngày dành 15–30 phút</li>
                </ul>
            </li>
            <li><strong>Shorts:</strong> 10–20 video/ngày</li>
            <li><strong>Thao tác Shorts:</strong>
                <ul>
                    <li>Xem mỗi video 3–4 lần</li>
                    <li>Lần 1: Like 👍</li>
                    <li>Lần 2: Bình luận 💬</li>
                    <li>Lần 3: Share ↗️</li>
                    <li>Lần 4: Đăng ký kênh 🔔</li>
                    <li>Không quá 10 bình luận/ngày</li>
                </ul>
            </li>
        </ul>

        <h3>Từ ngày 8 trở đi</h3>
        <p>👉 Lặp lại toàn bộ thao tác như trên (giữ nhịp ổn định để duy trì tín hiệu cho kênh).</p>
    </>
);


// Dữ liệu bài viết. Bạn có thể thêm các bài viết mới vào đây.
const articles: Article[] = [
  {
    id: 7,
    title: 'Quy Trình Ngâm Kênh YouTube Cho Người Mới Bắt Đầu',
    description: 'Hướng dẫn chi tiết quy trình 7 ngày để "ngâm" kênh YouTube mới, tạo tín hiệu tốt và chuẩn bị cho việc đăng video chính thức.',
    imageUrl: 'https://images.unsplash.com/photo-1611926653458-09294b3142b4?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tags: ['Tăng trưởng kênh', 'Chiến lược', 'Người mới'],
    content: newArticleContent,
  }
];

const LibraryPage: React.FC<LibraryPageProps> = ({ onGoHome, onNavigateToArticle }) => {

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      
      <div className="text-center mb-12">
        <h1 className="animated-gradient-text text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-brand-light-purple mb-4">
          Thư Viện Kinh Nghiệm YouTube
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-dark-text-secondary">
          Tổng hợp các bài viết, hướng dẫn và kinh nghiệm thực chiến giúp bạn xây dựng và phát triển kênh YouTube thành công.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map(article => (
          <button
            key={article.id}
            onClick={() => onNavigateToArticle(article)}
            className="group block text-left bg-dark-card rounded-xl border border-dark-border overflow-hidden transition-all duration-300 hover:border-brand-purple/50 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="aspect-video overflow-hidden">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {article.tags.map(tag => (
                  <span key={tag} className="text-xs font-semibold bg-brand-purple/20 text-brand-light-purple px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-brand-light-purple transition-colors">{article.title}</h2>
              <p className="text-dark-text-secondary text-sm leading-relaxed">{article.description}</p>
            </div>
          </button>
        ))}
      </div>
       <div className="text-center mt-12">
         <button onClick={onGoHome} className="py-3 px-8 bg-brand-purple text-white font-bold rounded-lg hover:bg-brand-light-purple transition-colors text-lg">
            Trở về Trang chủ
        </button>
      </div>
    </div>
  );
};

export default LibraryPage;
