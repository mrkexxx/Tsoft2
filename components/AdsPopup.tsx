import React, { useState, useEffect } from 'react';

const AdsPopup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [introIndex, setIntroIndex] = useState(0);

    // Danh sách các lời dẫn hài hước, nhẹ nhàng
    const intros = [
        "Hế lô người anh em thiện lành! Dừng tay một chút nghe Admin tâm sự mỏng nè...",
        "Đang hăng say sáng tạo à? Nghỉ ngơi 30 giây uống miếng nước và đọc tin nhắn gửi gắm từ Admin nhé!",
        "Ting ting! Vũ trụ gửi tín hiệu: Đã đến lúc tối ưu hóa công việc của bạn rồi!",
        "Thời gian là vàng! Admin ghé qua để nhắc bạn giữ gìn sức khỏe và làm việc hiệu quả hơn nè.",
        "Code tool thì mệt nhưng thấy anh em dùng hiệu quả là Admin vui rồi. Tâm sự chút nha!",
        "Alo alo! Không phải tổng đài đâu, là Admin Arsène Lupin ghé thăm và gửi lời chúc sức khỏe đấy.",
        "Đừng vội tắt, chờ 10s thôi mà! Biết đâu lại tìm được bí kíp giúp kênh triệu view?",
        "Một tách cà phê và vài lời nhắn nhủ từ đội ngũ phát triển gửi đến các Youtuber tài năng.",
    ];

    // Logic đếm ngược 10s để mở khóa nút đóng
    useEffect(() => {
        if (isOpen) {
            setCanClose(false);
            setCountdown(10);
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

    // Logic lặp lại mỗi 15 phút (15 * 60 * 1000)
    useEffect(() => {
        const interval = setInterval(() => {
            // Chọn lời dẫn tiếp theo
            setIntroIndex(prev => (prev + 1) % intros.length);
            setIsOpen(true);
        }, 15 * 60 * 1000); 

        return () => clearInterval(interval);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-dark-card border-2 border-brand-purple rounded-2xl shadow-[0_0_30px_rgba(109,40,217,0.6)] max-w-lg w-full p-8 relative text-center overflow-hidden">
                
                {/* Nút tắt (X) - Chỉ hiện khi canClose = true */}
                {canClose && (
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all z-20"
                        title="Đóng thông báo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Trang trí nền */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
                
                <div className="mb-6">
                     <div className="mx-auto w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-light-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                     </div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
                        GÓC TÂM SỰ CÙNG ADMIN
                    </h2>
                    <p className="text-gray-300 italic text-sm mb-6 border-b border-gray-700 pb-4">
                        "{intros[introIndex]}"
                    </p>
                </div>

                <div className="space-y-4 text-left bg-gray-900/50 p-5 rounded-xl border border-gray-700">
                    <p className="text-white leading-relaxed">
                        ❤️ Website này là tâm huyết được xây dựng bởi Admin <a href="https://zalo.me/0879382468" target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer bg-cyan-900/20 px-1 rounded">Arsène Lupin</a> dành tặng riêng cho anh em cộng đồng làm Youtube.
                    </p>
                    
                    <p className="text-gray-300 leading-relaxed">
                        Mong muốn lớn nhất của mình là giúp anh em làm video nhanh hơn, nhàn hơn và tiết kiệm thời gian quý báu để tập trung vào sáng tạo nội dung.
                    </p>

                    <div className="bg-brand-purple/10 border-l-4 border-brand-purple p-3 mt-2">
                        <p className="text-sm text-gray-300">
                            🚀 Nếu thấy công cụ hữu ích, anh em có thể ủng hộ mình bằng cách ghé xem các tài khoản A.I (ChatGPT, Gemini, Midjourney...) hoặc <strong>Tool Veo3 tạo video hàng loạt</strong> mà mình đang cung cấp nhé! Sự ủng hộ của anh em là động lực để mình duy trì và nâng cấp web tốt hơn mỗi ngày. 🥰
                        </p>
                    </div>

                    <div className="pt-4">
                        <a 
                            href="https://zalo.me/g/qnkofg173" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg border border-blue-500/30"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            Tham gia Group Hỗ Trợ Anh Em Youtube
                        </a>
                        <p className="text-center text-xs text-gray-500 mt-3">
                            Cần hỗ trợ gấp? Hotline Admin: <span className="text-orange-400 font-semibold">037 28 99999</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(false)}
                    disabled={!canClose}
                    className={`mt-6 w-full py-3 rounded-lg font-bold transition-all ${
                        canClose 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer shadow-md border border-gray-600' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-transparent'
                    }`}
                >
                    {canClose ? "Đã hiểu, mình sẽ ủng hộ sau ❤️" : `Vui lòng đợi giây lát (${countdown}s)`}
                </button>
            </div>
        </div>
    );
};

export default AdsPopup;