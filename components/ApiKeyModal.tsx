import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
  initialError?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, initialError }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(initialError || '');

  const handleSave = () => {
    if (key.trim().length < 10) { // Basic validation
      setError('Vui lòng nhập một API Key hợp lệ.');
      return;
    }
    setError('');
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 text-white border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Yêu Cầu API Key</h2>
        <p className="text-gray-300 mb-6">
          Để sử dụng ứng dụng, vui lòng cung cấp Gemini API Key của bạn. Ứng dụng sẽ lưu key này vào bộ nhớ cục bộ của trình duyệt để bạn không cần nhập lại trong các lần truy cập sau.
        </p>
        <div className="mb-4">
          <label htmlFor="apiKeyInput" className="block text-sm font-medium text-gray-300 mb-2">
            Gemini API Key
          </label>
          <input
            id="apiKeyInput"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            placeholder="Nhập API Key của bạn tại đây"
          />
           {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Lấy API Key của bạn từ Google AI Studio
        </a>
        <div className="flex justify-end mt-6">
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors"
          >
            Lưu và Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
