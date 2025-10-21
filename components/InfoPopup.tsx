import React from 'react';

interface InfoPopupProps {
  onClose: () => void;
}

const InfoPopup: React.FC<InfoPopupProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="relative bg-dark-card rounded-lg shadow-2xl w-full max-w-md p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg text-dark-text leading-relaxed mb-6">
          Tsoft2 được viết bởi <a href="https://zalo.me/0879382468" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-light-purple hover:underline">Arsène Lupin</a> là hàng tặng kèm không bán khi mua Tsoft1.
        </p>
        <button
          onClick={onClose}
          className="py-2 px-8 bg-brand-purple text-white font-bold rounded-lg hover:bg-brand-light-purple transition-colors"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};

export default InfoPopup;
