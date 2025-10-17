import React from 'react';
import type { Scene } from '../types';

interface SceneConfirmationModalProps {
  scene: Scene;
  onConfirm: () => void;
  onCancel: () => void;
}

const SceneConfirmationModal: React.FC<SceneConfirmationModalProps> = ({ scene, onConfirm, onCancel }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 text-white"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <h2 className="text-2xl font-bold mb-4">Xác nhận xóa bối cảnh</h2>
        <p className="text-gray-300 mb-4">
          Bạn có chắc chắn muốn xóa bối cảnh này không? Hành động này không thể hoàn tác.
        </p>
        <div className="mb-6 rounded-md overflow-hidden border border-gray-700">
            <img src={scene.imageUrl} alt="Xem trước bối cảnh" className="w-full h-auto object-contain" />
        </div>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onCancel} 
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm} 
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default SceneConfirmationModal;
