import React, { useState } from 'react';
import { AlertTriangleIcon, TrashIcon, GoogleIcon, CloudIcon } from './icons';
import type { StorageMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
  characterCount: number;
  sceneCount: number;
  storageMode: StorageMode;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSwitchToLocal: () => void;
  onSwitchToDrive: () => void;
  user: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onClearData, 
  characterCount, 
  sceneCount,
  storageMode,
  isAuthenticated,
  onSignIn,
  onSignOut,
  onSwitchToLocal,
  onSwitchToDrive,
  user
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleClearClick = () => {
    onClearData();
    setShowConfirmation(false);
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
        <h2 className="text-2xl font-bold mb-6">Cài đặt & Quản lý Dữ liệu</h2>
        
        {/* Storage and Sync Section */}
        <div className="bg-gray-700/50 p-4 rounded-md mb-6">
          <h3 className="font-semibold text-cyan-400 mb-3">Lưu trữ & Đồng bộ</h3>
          {isAuthenticated && user && (
             <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-md mb-4">
              <div className="flex items-center gap-3">
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <button onClick={onSignOut} className="text-sm text-red-400 hover:underline">Đăng xuất</button>
            </div>
          )}

          <div className="flex items-center gap-4 p-3 rounded-md"
            style={{background: storageMode === 'drive' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(107, 114, 128, 0.1)'}}
          >
              <CloudIcon className={`w-8 h-8 ${storageMode === 'drive' ? 'text-green-400' : 'text-gray-400'}`} />
              <div>
                  <p className="font-semibold">
                      {storageMode === 'drive' ? 'Dữ liệu được đồng bộ với Google Drive' : 'Dữ liệu chỉ được lưu trên thiết bị này'}
                  </p>
                  {storageMode === 'local' && !isAuthenticated && (
                       <button onClick={onSignIn} className="text-sm text-cyan-400 hover:underline">Đăng nhập để đồng bộ</button>
                  )}
                   {storageMode === 'local' && isAuthenticated && (
                       <button onClick={onSwitchToDrive} className="text-sm text-green-400 hover:underline">Chuyển sang lưu trên Google Drive</button>
                  )}
                  {storageMode === 'drive' && (
                       <button onClick={onSwitchToLocal} className="text-sm text-yellow-400 hover:underline">Chuyển sang lưu trên thiết bị này</button>
                  )}
              </div>
          </div>
        </div>


        {/* Data Stats Section */}
        <div className="bg-gray-700/50 p-4 rounded-md mb-6">
          <h3 className="font-semibold text-cyan-400 mb-2">Thống kê Dữ liệu Hiện tại</h3>
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

        {/* Danger Zone Section */}
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-md">
          <h3 className="font-semibold text-red-400 mb-2 flex items-center">
            <AlertTriangleIcon className="w-5 h-5 mr-2"/>
            Vùng Nguy hiểm
          </h3>
          <p className="text-gray-300 text-sm mb-4">Hành động này sẽ xóa vĩnh viễn dữ liệu từ <strong className="font-bold">{storageMode === 'drive' ? 'Google Drive' : 'thiết bị này'}</strong>. Không thể hoàn tác.</p>
          
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
