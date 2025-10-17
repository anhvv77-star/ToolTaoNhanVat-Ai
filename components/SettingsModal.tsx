import React, { useState } from 'react';
import { AlertTriangleIcon, TrashIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
  characterCount: number;
  sceneCount: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onClearData, 
  characterCount, 
  sceneCount 
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleClearClick = () => {
    onClearData();
    setShowConfirmation(false); // Reset confirmation state
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center"
      onClick={handleCancel}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 text-white border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Cài đặt & Quản lý Dữ liệu</h2>
        
        <div className="bg-gray-700/50 p-4 rounded-md mb-6">
          <h3 className="font-semibold text-cyan-400 mb-2">Thống kê Dữ liệu</h3>
          <p className="text-gray-300">Dữ liệu của bạn được lưu trữ an toàn trong bộ nhớ cục bộ của trình duyệt.</p>
          <div className="mt-3 flex space-x-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{characterCount}</p>
              <p className="text-sm text-gray-400">Nhân vật</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{sceneCount}</p>
              <p className="text-sm text-gray-400">Bối cảnh</p>
            </div>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-md">
          <h3 className="font-semibold text-red-400 mb-2 flex items-center">
            <AlertTriangleIcon className="w-5 h-5 mr-2"/>
            Vùng Nguy hiểm
          </h3>
          <p className="text-gray-300 text-sm mb-4">Hành động bên dưới sẽ xóa vĩnh viễn toàn bộ nhân vật và bối cảnh đã lưu của bạn. Hành động này không thể hoàn tác.</p>
          
          {!showConfirmation ? (
            <button
              onClick={() => setShowConfirmation(true)}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors"
            >
                <TrashIcon className="w-5 h-5 mr-2"/>
                Xóa Toàn Bộ Dữ Liệu
            </button>
          ) : (
            <div className="bg-gray-700 p-4 rounded-md">
                <p className="font-semibold text-center mb-4">Bạn có chắc chắn muốn tiếp tục?</p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setShowConfirmation(false)} 
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleClearClick} 
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
                    >
                        Xác nhận Xóa
                    </button>
                </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-right">
           <button 
            onClick={handleCancel} 
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
