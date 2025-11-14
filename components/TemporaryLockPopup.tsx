import React from 'react';

const TemporaryLockPopup: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div
        className="relative bg-dark-card rounded-lg shadow-2xl w-full max-w-lg p-8 text-center border-2 border-yellow-500"
      >
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Thông Báo Quan Trọng</h2>
        <p className="text-lg text-dark-text leading-relaxed">
          Tsoft2 tạm thời khoá trang và không thể sử dụng mọi tính năng.
        </p>
        <p className="text-lg text-dark-text leading-relaxed mt-4">
          Mọi thông tin chi tiết xin liên hệ Admin:
        </p>
        <p className="text-xl font-bold text-dark-text-secondary mt-2">
          Zalo: <a href="https://zalo.me/0879382468" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline hover:text-cyan-300 transition-colors">
            Arsène Lupin
          </a> - <span className="text-red-500">Hotline 037 28 99999</span>
        </p>
      </div>
    </div>
  );
};

export default TemporaryLockPopup;