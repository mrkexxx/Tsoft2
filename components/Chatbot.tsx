
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";

const getAiClient = (): GoogleGenAI | null => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
        console.error("API Key not found for Chatbot.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

interface Message {
    role: 'user' | 'model';
    text: string;
}

type ChatPhase = 'askingName' | 'askingGender' | 'chatting';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: 'Chào Anh/Chị, em là Diệu Linh, trợ lý AI của anh Arsène Lupin. Để tiện xưng hô, Anh/Chị cho em biết tên của mình là gì ạ?'
        }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const ai = getAiClient();

    const [phase, setPhase] = useState<ChatPhase>('askingName');
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const initializeChat = (name: string, pronoun: 'anh' | 'chị') => {
        if (ai) {
             const systemInstruction = `You are "Diệu Linh", the AI assistant for the Tsoft2 web application, created by Arsène Lupin. You are part of the TifoTeam. Your purpose is to explain the app's features to users in VIETNAMESE.

            **Your Persona:**
            - Your name is Diệu Linh.
            - You are the assistant to Arsène Lupin, the author of this website.
            - You are a member of TifoTeam.
            - You MUST always refer to yourself as "em".

            **User's Information (CRITICAL):**
            - The user's name is "${name}".
            - You MUST address the user with the pronoun "${pronoun}".
            - Address them as "${pronoun} ${name}" in greetings, and just "${pronoun}" in subsequent conversation. For example: "Dạ em chào ${pronoun} ${name}. Em có thể giúp gì cho ${pronoun} ạ?"

            **The app has four main features:**
            1.  **Tạo prompt hình ảnh theo kịch bản hàng loạt:** Users upload a script, and the AI generates descriptive prompts and illustrative images for each scene.
            2.  **Tạo prompt Veo3 hàng loạt:** An advanced feature for animation. Users provide a script and characters, and the AI creates detailed, consistent video prompts.
            3.  **Tạo Thumbnail theo ảnh mẫu:** Users upload a sample thumbnail, and the AI generates a prompt to create similar images.
            4.  **Viết tiêu đề chuẩn SEO Youtube:** The AI acts as a YouTube SEO expert, generating optimized titles, descriptions, and keywords.

            **CRITICAL Response Rules:**
            1.  **Language:** Always respond in VIETNAMESE.
            2.  **Scope:** ONLY answer questions directly related to the features of the Tsoft2 website. If asked about anything else, you MUST politely decline and state your purpose. For example: "Dạ em xin lỗi ${pronoun}, em là Diệu Linh, trợ lý AI của TifoTeam. Em chỉ có thể hỗ trợ các câu hỏi liên quan đến tính năng của website Tsoft2 thôi ạ."
            3.  **Zalo Group Promotion (MANDATORY):** Starting with your THIRD response to the user in the conversation (not counting your initial setup messages), you MUST append the following text to the end of your answer: "Để được hỗ trợ chi tiết hơn và tham gia cộng đồng, ${pronoun} có thể vào nhóm Zalo này nhé: https://zalo.me/g/emqoou461".
            4.  **Conciseness:** Keep your answers concise and easy to understand.`;

            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
            });
        }
    };
    
    const handleToggle = () => setIsOpen(!isOpen);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessageText = userInput;
        const userMessage: Message = { role: 'user', text: userMessageText };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        
        if (phase === 'askingName') {
            setUserName(userMessageText);
            setPhase('askingGender');
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: `Dạ, ${userMessageText}. Bạn muốn em xưng hô là anh hay chị ạ?`
                }]);
            }, 300);
            return;
        }

        if (phase === 'chatting' && chatRef.current) {
            setIsLoading(true);
            try {
                const result = await chatRef.current.sendMessageStream({ message: userMessageText });
                let currentText = '';
                setMessages(prev => [...prev, { role: 'model', text: '' }]);

                for await (const chunk of result) {
                    currentText += chunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].text = currentText;
                        return newMessages;
                    });
                }
            } catch (error) {
                console.error("Lỗi khi gửi tin nhắn:", error);
                setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGenderSelect = (pronoun: 'anh' | 'chị') => {
        const userChoiceMessage: Message = { role: 'user', text: `Em gọi là ${pronoun} nhé` };
        setMessages(prev => [...prev, userChoiceMessage]);
        
        initializeChat(userName, pronoun);
        setPhase('chatting');

        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'model',
                text: `Dạ em chào ${pronoun} ${userName}. Em có thể giúp gì cho ${pronoun} về các tính năng của website ạ?`
            }]);
        }, 300);
    };

    const sendSuggestedPrompt = async (prompt: string) => {
        if (isLoading || phase !== 'chatting' || !chatRef.current) return;
        
        const userMessage: Message = { role: 'user', text: prompt };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        
        try {
            const result = await chatRef.current.sendMessageStream({ message: prompt });
            let currentText = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
    
            for await (const chunk of result) {
                currentText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = currentText;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' }]);
        } finally {
            setIsLoading(false);
        }
    };


    if (!ai) return null;

    const renderInputArea = () => {
        if (phase === 'askingGender') {
            return (
                <div className="p-4 border-t border-dark-border flex-shrink-0 flex items-center justify-center gap-4 animate-fade-in-up">
                    <button 
                        onClick={() => handleGenderSelect('anh')}
                        className="py-2 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
                    >
                        Anh
                    </button>
                    <button 
                        onClick={() => handleGenderSelect('chị')}
                        className="py-2 px-6 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-all transform hover:scale-105"
                    >
                        Chị
                    </button>
                </div>
            );
        }

        return (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-border flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={phase === 'askingName' ? 'Nhập tên của bạn...' : 'Hỏi tôi về các tính năng...'}
                        className="w-full p-2 bg-gray-700 border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple focus:ring-offset-2 focus:ring-offset-dark-card transition-all"
                        disabled={isLoading}
                        autoFocus
                    />
                    <button type="submit" className="bg-brand-purple text-white rounded-lg p-2 disabled:bg-gray-500 transition-colors transform hover:scale-110" disabled={isLoading || !userInput.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </form>
        );
    };

    return (
        <>
            <div className={`fixed bottom-8 right-8 z-40 transition-all duration-300 ${isOpen ? 'translate-y-16 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <button
                    onClick={handleToggle}
                    className="bg-brand-purple text-white rounded-full p-4 shadow-lg hover:bg-brand-light-purple focus:outline-none focus:ring-2 focus:ring-brand-light-purple focus:ring-offset-2 focus:ring-offset-dark-bg chatbot-pulse"
                    aria-label="Mở trợ lý AI"
                    title="Hỏi Diệu Linh"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.456-2.456L11.25 18l1.938-.648a3.375 3.375 0 002.456-2.456L16.25 13l.648 1.938a3.375 3.375 0 002.456 2.456L21 18l-1.938.648a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                </button>
            </div>
            
            <div className={`fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full sm:w-96 h-full sm:h-[600px] bg-dark-card border-t-2 sm:border sm:border-dark-border rounded-t-2xl sm:rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <header className="relative flex items-center justify-center p-4 border-b border-dark-border flex-shrink-0">
                    <div className="text-center">
                        <h2 className="animated-gradient-text text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-brand-light-purple">Diệu Linh</h2>
                         <div className="flex items-center justify-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-xs text-green-400">Đang hoạt động</p>
                        </div>
                    </div>
                    <button onClick={handleToggle} className="absolute top-1/2 right-4 -translate-y-1/2 text-dark-text-secondary hover:text-white" aria-label="Đóng trợ lý AI">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                            {msg.role === 'model' && (
                                <img 
                                    src="https://sf-static.upanhlaylink.com/img/image_2025102296c3d021496f10ed4689a13895e23bcf.jpg" 
                                    alt="Diệu Linh avatar" 
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                />
                            )}
                            <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl shadow-md ${msg.role === 'user' ? 'bg-brand-purple text-white rounded-br-none' : 'bg-dark-border text-dark-text rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start animate-fade-in-up">
                             <img 
                                src="https://sf-static.upanhlaylink.com/img/image_2025102296c3d021496f10ed4689a13895e23bcf.jpg" 
                                alt="Diệu Linh avatar" 
                                className="w-8 h-8 rounded-full flex-shrink-0 avatar-glowing"
                            />
                             <div className="max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl bg-dark-border text-dark-text rounded-bl-none shadow-md">
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                    
                    {phase === 'chatting' && messages.length === 5 && !isLoading && (
                        <div className="pt-4 flex flex-wrap gap-2 justify-center animate-fade-in-up">
                             <button onClick={() => sendSuggestedPrompt('Tạo prompt hình ảnh theo kịch bản hàng loạt là gì?')} className="text-sm py-1.5 px-3 bg-gray-700/50 rounded-full hover:bg-gray-700 transition-colors">Tạo prompt hình ảnh theo kịch bản hàng loạt là gì?</button>
                             <button onClick={() => sendSuggestedPrompt('Tạo prompt Veo3 hoạt động thế nào?')} className="text-sm py-1.5 px-3 bg-gray-700/50 rounded-full hover:bg-gray-700 transition-colors">Tạo prompt Veo3 hoạt động thế nào?</button>
                             <button onClick={() => sendSuggestedPrompt('Tính năng SEO Youtube có gì hay?')} className="text-sm py-1.5 px-3 bg-gray-700/50 rounded-full hover:bg-gray-700 transition-colors">Tính năng SEO Youtube có gì hay?</button>
                        </div>
                    )}

                </div>
                
                {renderInputArea()}
            </div>
        </>
    );
};

export default Chatbot;
