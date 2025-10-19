import { HistoryItem, GeneratedImage } from '../types';

const HISTORY_KEY = 'generationHistory';

// Lấy toàn bộ lịch sử từ localStorage
export const getHistory = (): HistoryItem[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        if (historyJson) {
            return JSON.parse(historyJson);
        }
    } catch (error) {
        console.error("Lỗi khi đọc lịch sử từ localStorage:", error);
        localStorage.removeItem(HISTORY_KEY); // Xóa dữ liệu bị hỏng
    }
    return [];
};

// Lưu toàn bộ lịch sử vào localStorage
const saveHistory = (history: HistoryItem[]) => {
    try {
        // Giới hạn lịch sử chỉ lưu 50 mục gần nhất để tránh đầy localStorage
        const limitedHistory = history.slice(-50);
        const historyJson = JSON.stringify(limitedHistory);
        localStorage.setItem(HISTORY_KEY, historyJson);
    } catch (error) {
        console.error("Lỗi khi lưu lịch sử vào localStorage:", error);
    }
};

// Thêm một mục mới vào lịch sử
export const addHistoryItem = (item: Omit<HistoryItem, 'timestamp'>): void => {
    const history = getHistory();
    const newItem: HistoryItem = {
        ...item,
        timestamp: new Date().toLocaleString('vi-VN')
    };
    history.push(newItem);
    saveHistory(history);
};

// Cập nhật một mục trong lịch sử (ví dụ: thêm ảnh mới)
export const updateHistoryItemImages = (id: number, newImages: GeneratedImage[]): void => {
    const history = getHistory();
    const itemIndex = history.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        history[itemIndex].images = newImages;
        saveHistory(history);
    }
};

// Xóa một mục khỏi lịch sử
export const deleteHistoryItem = (id: number): void => {
    let history = getHistory();
    history = history.filter(item => item.id !== id);
    saveHistory(history);
};

// Xóa toàn bộ lịch sử
export const clearHistory = (): void => {
    localStorage.removeItem(HISTORY_KEY);
};
