import React from 'react';

interface LoaderProps {
    message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message: customMessage }) => {
    const defaultMessages = [
        "Đang phân tích kịch bản...",
        "Chia kịch bản thành các phân cảnh...",
        "Tạo mô tả chi tiết cho từng phân cảnh...",
        "Sắp hoàn tất...",
    ];

    const [message, setMessage] = React.useState(customMessage || defaultMessages[0]);

    React.useEffect(() => {
        if (customMessage) {
            setMessage(customMessage);
            return;
        }

        const interval = setInterval(() => {
            setMessage(prev => {
                const currentIndex = defaultMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % defaultMessages.length;
                return defaultMessages[nextIndex];
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [customMessage, defaultMessages]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-t-brand-purple border-gray-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-xl text-white font-semibold">{message}</p>
    </div>
  );
};

export default Loader;