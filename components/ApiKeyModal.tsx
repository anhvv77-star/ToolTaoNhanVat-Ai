import React, { useState } from 'react';
import { WandSparklesIcon } from './icons';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!key.trim()) {
      setError('Vui lòng nhập API Key của bạn.');
      return;
    }
    setError('');
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-6">
          <WandSparklesIcon className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
          <h1 className="text-3xl font-bold text-white">Yêu Cầu API Key</h1>
          <p className="text-gray-400 mt-2">
            Để sử dụng các tính năng AI, vui lòng nhập Google AI API Key của bạn.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-1">
              Google AI API Key
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Nhập API Key của bạn tại đây"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                aria-label={showKey ? 'Ẩn key' : 'Hiện key'}
              >
                {showKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                )}
              </button>
            </div>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          </div>

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Lưu và Bắt đầu
          </button>
        </div>

        <div className="text-center mt-6">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Không có key? Lấy một key miễn phí tại Google AI Studio
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
