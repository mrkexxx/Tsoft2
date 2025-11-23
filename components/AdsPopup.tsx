import React, { useState, useEffect } from 'react';

interface AdContent {
    id: string;
    themeColor: string; // Tailwind class for gradient
    icon: React.ReactNode;
    title: string;
    message: React.ReactNode;
    ctaText: string;
    ctaLink: string;
}

const AdsPopup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    // Danh sách nội dung quảng cáo đa dạng
    const adsData: AdContent[] = [
        {
            id: 'community',
            themeColor: 'from-blue-600 to-cyan-500',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            title: "CỘNG ĐỒNG YOUTUBE TẤN VĂN",
            message: (
                <>
                    Bạn đang làm Youtube một mình? Đừng lủi thủi nữa! <br/>
                    Tham gia ngay <strong>Group Zalo</strong> để cùng chia sẻ kinh nghiệm, học hỏi cách xây kênh và cập nhật những tut/trick mới nhất từ anh em trong nghề.
                </>
            ),
            ctaText: "Tham gia Group Zalo Ngay",
            ctaLink: "https://zalo.me/g/qnkofg173"
        },
        {
            id: 'tool-veo3',
            themeColor: 'from-purple-600 to-pink-500',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            title: "TOOL VEO3 ULTRA - TỰ ĐỘNG HÓA",
            message: (
                <>
                    Bạn mất quá nhiều thời gian để làm video hoạt hình? <br/>
                    Khám phá ngay <strong>Tool Veo3 Ultra</strong> - Giải pháp tạo video hàng loạt, tự động hóa quy trình từ kịch bản đến hình ảnh. Xây kênh nhàn tênh!
                </>
            ),
            ctaText: "Tìm hiểu Tool Veo3",
            ctaLink: "https://zalo.me/g/qnkofg173"
        },
        {
            id: 'support',
            themeColor: 'from-orange-500 to-red-500',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            title: "HỖ TRỢ TRỰC TIẾP TỪ ADMIN",
            message: (
                <>
                    Gặp khó khăn khi sử dụng Tsoft2? Hay cần tư vấn về tài nguyên MMO, tài khoản ChatGPT/Gemini? <br/>
                    Liên hệ trực tiếp với <strong>Arsène Lupin</strong> để được support tận răng nhé!
                </>
            ),
            ctaText: "Chat với Admin",
            ctaLink: "https://zalo.me/0879382468"
        },
        {
            id: 'resources',
            themeColor: 'from-green-500 to-emerald-600',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            title: "KHO TÀI NGUYÊN MMO - TIFOSHOP",
            message: (
                <>
                    Thiếu tài nguyên làm Youtube? Cần mua VPS, Proxy, hay Acc Trust? <br/>
                    Ghé ngay <strong>TifoShop</strong> - Cộng đồng mua bán, trao đổi tài nguyên uy tín cho dân MMO.
                </>
            ),
            ctaText: "Vào Chợ TifoShop",
            ctaLink: "https://zalo.me/g/vskind805"
        }
    ];

    // Randomize ad on mount or rotation
    useEffect(() => {
        // Chọn ngẫu nhiên một nội dung khi component mount lần đầu
        setCurrentAdIndex(Math.floor(Math.random() * adsData.length));
    }, []);

    // Logic đếm ngược 3s
    useEffect(() => {
        if (isOpen) {
            setCanClose(false);
            setCountdown(3);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setCanClose(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    // Logic lặp lại mỗi 15 phút
    useEffect(() => {
        const interval = setInterval(() => {
            // Chuyển sang nội dung tiếp theo trong danh sách
            setCurrentAdIndex(prev => (prev + 1) % adsData.length);
            setIsOpen(true);
        }, 15 * 60 * 1000); 

        return () => clearInterval(interval);
    }, []);

    if (!isOpen) return null;

    const currentAd = adsData[currentAdIndex];

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-md">
            <div className="bg-dark-card rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row relative border border-gray-700">
                
                {/* Close Button */}
                {canClose && (
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all z-20 backdrop-blur-sm"
                        title="Đóng thông báo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Left Side: Visual & Icon (35% width) */}
                <div className={`md:w-5/12 bg-gradient-to-br ${currentAd.themeColor} p-8 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>
                    
                    <div className="relative z-10 transform transition-transform hover:scale-110 duration-500">
                        {currentAd.icon}
                    </div>
                    <h3 className="relative z-10 text-white font-black text-2xl mt-6 uppercase tracking-wider leading-tight drop-shadow-md">
                        {currentAd.title}
                    </h3>
                </div>

                {/* Right Side: Content (65% width) */}
                <div className="md:w-7/12 p-8 bg-dark-card flex flex-col justify-between relative">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-700 text-gray-300 uppercase tracking-wider border border-gray-600">
                                Thông báo từ Admin
                             </span>
                        </div>
                        
                        <div className="text-gray-300 text-lg leading-relaxed mb-6">
                            {currentAd.message}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <a 
                            href={currentAd.ctaLink}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r ${currentAd.themeColor} text-white rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl`}
                        >
                            {currentAd.ctaText}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </a>
                        
                        <button
                            onClick={() => setIsOpen(false)}
                            disabled={!canClose}
                            className={`w-full py-3 text-sm font-medium transition-colors rounded-lg border ${
                                canClose 
                                ? 'text-gray-400 hover:text-white border-transparent hover:bg-gray-800' 
                                : 'text-gray-600 border-transparent cursor-wait'
                            }`}
                        >
                            {canClose ? "Bỏ qua, tôi đang bận" : `Vui lòng đợi giây lát (${countdown}s)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdsPopup;