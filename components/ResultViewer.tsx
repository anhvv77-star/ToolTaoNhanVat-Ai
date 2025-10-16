
import React from 'react';
import { DownloadIcon, EditIcon, PlusCircleIcon } from './icons';

interface ResultViewerProps {
  image: string;
  onEdit: () => void;
  onNew: () => void;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ image, onEdit, onNew }) => {

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `ai-scene-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-white mb-2">Tác Phẩm Hoàn Chỉnh!</h1>
      <p className="text-gray-400 mb-8">Đây là kết quả AI đã tạo ra dựa trên yêu cầu của bạn.</p>
      
      <div className="w-full max-w-2xl bg-gray-800 p-4 rounded-lg shadow-2xl mb-8">
        <img src={image} alt="Generated Scene" className="w-full h-auto object-contain rounded-md" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        <button onClick={handleDownload} className="flex-1 flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300">
          <DownloadIcon className="w-5 h-5 mr-2" />
          Tải Xuống
        </button>
        <button onClick={onEdit} className="flex-1 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300">
          <EditIcon className="w-5 h-5 mr-2" />
          Chỉnh Sửa
        </button>
        <button onClick={onNew} className="flex-1 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Tạo Mới
        </button>
      </div>
    </div>
  );
};

export default ResultViewer;
