import React, { useState, useRef, useEffect } from 'react';
import { type Message } from '../types';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, image?: File) => void;
}

const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const PaperclipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);


const ChatView: React.FC<ChatViewProps> = ({ messages, isLoading, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputValue.trim() || imageFile) && !isLoading) {
      onSendMessage(inputValue, imageFile || undefined);
      setInputValue('');
      handleRemoveImage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto" style={{ backgroundColor: '#F5F7FA' }}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-3 rounded-2xl shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#1A73E8] text-white rounded-br-none'
                    : 'bg-white text-[#1F2937] rounded-bl-none'
                }`}
              >
                {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Anexo" className="rounded-lg mb-2 max-w-full h-auto max-h-60" />
                )}
                <p className="text-sm" style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="max-w-xs p-3 rounded-2xl shadow-md bg-white rounded-bl-none">
                <div className="flex items-center space-x-1">
                    <span className="text-sm text-[#6B7280]">A analisar...</span>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t border-[#D0D5DD] p-4 bg-white">
        {imagePreview && (
            <div className="relative inline-block mb-2">
                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                <button 
                    onClick={handleRemoveImage}
                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-[#EF4444] text-white rounded-full p-1"
                >
                    <XIcon className="h-3 w-3" />
                </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite a sua despesa aqui..."
            className="flex-1 w-full px-4 py-2 text-[#1F2937] bg-white border border-[#D0D5DD] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
            disabled={isLoading}
          />
           <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
          <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-3 text-[#6B7280] rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
            >
                <PaperclipIcon className="w-5 h-5" />
            </button>
          <button
            type="submit"
            disabled={isLoading || (!inputValue.trim() && !imageFile)}
            className="flex-shrink-0 p-3 bg-[#1A73E8] text-white rounded-full hover:opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 transition-all duration-200"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;