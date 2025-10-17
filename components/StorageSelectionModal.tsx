import React from 'react';
import { GoogleIcon, CloudIcon } from './icons';

interface StorageSelectionModalProps {
  onSelect: (mode: 'local' | 'drive') => void;
}

const StorageSelectionModal: React.FC<StorageSelectionModalProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4 text-white border border-gray-700 text-center">
        <CloudIcon className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
        <h2 className="text-2xl font-bold mb-4">Lưu trữ & Đồng bộ</h2>
        <p className="text-gray-300 mb-8">
          Bạn muốn lưu trữ nhân vật và bối cảnh của mình ở đâu?
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelect('drive')}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors text-lg"
          >
            <GoogleIcon className="w-6 h-6" />
            Đồng bộ với Google Drive
          </button>
          <button
            onClick={() => onSelect('local')}
            className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors"
          >
            Chỉ lưu trên thiết bị này
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-6">
          Lưu trên Google Drive cho phép bạn truy cập dữ liệu của mình từ bất kỳ đâu. Bạn có thể thay đổi lựa chọn này sau trong phần Cài đặt.
        </p>
      </div>
    </div>
  );
};

export default StorageSelectionModal;
