import React, { useState } from 'react';
import { validateApiKey } from '../services/geminiService';
import { CheckCircleIcon } from './icons';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
  initialError?: string;
}

type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, initialError }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(initialError || '');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKey(e.target.value);
    setValidationStatus('idle');
    setError('');
  }

  const handleValidate = async () => {
    if (key.trim().length < 10) {
      setError('Vui lòng nhập một API Key hợp lệ.');
      setValidationStatus('error');
      return;
    }
    setValidationStatus('validating');
    setError('');
    try {
      await validateApiKey(key.trim());
      setValidationStatus('success');
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định.");
      setValidationStatus('error');
    }
  };

  const handleSave = () => {
    if (validationStatus !== 'success') {
      setError('Vui lòng kiểm tra và xác thực API Key của bạn trước khi lưu.');
      return;
    }
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
            onChange={handleKeyChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            placeholder="Nhập API Key của bạn tại đây"
          />
           {validationStatus === 'error' && error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
           {validationStatus === 'success' && <p className="text-green-400 mt-2 text-sm flex items-center"><CheckCircleIcon className="w-5 h-5 mr-1.5" /> API Key hợp lệ và sẵn sàng sử dụng!</p>}
        </div>
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Lấy API Key của bạn từ Google AI Studio
        </a>
        <div className="flex justify-end items-center mt-6 gap-4">
          <button 
            onClick={handleValidate} 
            disabled={validationStatus === 'validating' || !key.trim()}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center"
          >
            {validationStatus === 'validating' && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {validationStatus === 'validating' ? 'Đang kiểm tra...' : 'Kiểm tra Key'}
          </button>
          <button 
            onClick={handleSave}
            disabled={validationStatus !== 'success'}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Lưu và Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;