

import React from 'react';
import type { Character, Scene } from '../types';
import { PlusCircleIcon, UsersIcon, CheckCircleIcon, DownloadIcon, TrashIcon, SettingsIcon } from './icons';

interface CharacterLibraryProps {
  characters: Character[];
  savedScenes: Scene[];
  selectedCharacterIds: string[];
  onSelectCharacter: (id: string) => void;
  onCreateCharacter: () => void;
  onGenerateScene: () => void;
  onDeleteCharacter: (id: string) => void;
  onDeleteScene: (id: string) => void;
  onOpenSettings: () => void;
}

const CharacterLibrary: React.FC<CharacterLibraryProps> = ({ 
  characters, 
  savedScenes,
  selectedCharacterIds, 
  onSelectCharacter, 
  onCreateCharacter, 
  onGenerateScene, 
  onDeleteCharacter,
  onDeleteScene,
  onOpenSettings
}) => {
  const handleDownloadCharacter = (e: React.MouseEvent, char: Character) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click của thẻ cha (chọn nhân vật)
    const link = document.createElement('a');
    link.href = char.imageUrl;
    link.download = `${char.name.replace(/\s+/g, '_')}-character.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCharacter = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation(); // Prevent selecting the character
    onDeleteCharacter(charId);
  };
  
  const handleDownloadScene = (e: React.MouseEvent, scene: Scene) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = scene.imageUrl;
    const fileName = scene.prompt ? `${scene.prompt.substring(0, 30).replace(/\s+/g, '_')}.png` : `scene-${scene.id}.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDeleteSceneClick = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation();
    onDeleteScene(sceneId);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Thư Viện</h1>
            <p className="text-gray-400 mt-1">Quản lý nhân vật và các bối cảnh đã lưu của bạn.</p>
          </div>
           <button 
            onClick={onOpenSettings}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Mở cài đặt"
            title="Cài đặt & Quản lý Dữ liệu"
          >
            <SettingsIcon className="w-6 h-6"/>
          </button>
        </div>
        <button 
          onClick={onGenerateScene} 
          disabled={selectedCharacterIds.length === 0}
          className="mt-4 sm:mt-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
        >
          <UsersIcon className="w-5 h-5 mr-2" />
          Tạo Bối Cảnh
        </button>
      </div>

      <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Nhân Vật</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <div 
          onClick={onCreateCharacter}
          className="group cursor-pointer aspect-w-1 aspect-h-1 flex flex-col items-center justify-center bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 hover:border-cyan-500 hover:bg-gray-700 transition-all duration-300"
        >
          <PlusCircleIcon className="w-12 h-12 text-gray-500 group-hover:text-cyan-400 transition-colors" />
          <span className="mt-2 text-sm font-medium text-gray-400 group-hover:text-cyan-400">Tạo Mới</span>
        </div>
        {characters.map((char) => (
          <div 
            key={char.id} 
            onClick={() => onSelectCharacter(char.id)}
            className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${selectedCharacterIds.includes(char.id) ? 'ring-4 ring-cyan-500' : 'ring-2 ring-transparent'}`}
          >
            <div className="absolute top-2 left-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleDownloadCharacter(e, char)}
                  className="p-1.5 bg-black/50 rounded-full text-white hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  aria-label={`Tải xuống ${char.name}`}
                  title={`Tải xuống ${char.name}`}
                >
                  <DownloadIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => handleDeleteCharacter(e, char.id)}
                  className="p-1.5 bg-black/50 rounded-full text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Xóa ${char.name}`}
                  title={`Xóa ${char.name}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover aspect-[3/4]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-3 w-full">
              <h3 className="text-white font-semibold truncate">{char.name}</h3>
              <p className="text-xs text-gray-300 truncate">{char.style}, {char.gender}</p>
            </div>
            {selectedCharacterIds.includes(char.id) && (
                <div className="absolute top-2 right-2 bg-cyan-500 rounded-full p-1.5 text-white pointer-events-none">
                    <CheckCircleIcon className="w-5 h-5" />
                </div>
            )}
          </div>
        ))}
      </div>
       {characters.length === 0 && (
            <div className="col-span-full text-center py-16 bg-gray-800/50 rounded-lg">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-lg font-medium text-white">Chưa có nhân vật nào</h3>
                <p className="mt-1 text-sm text-gray-400">Hãy bắt đầu bằng cách tạo nhân vật đầu tiên của bạn.</p>
            </div>
        )}
      
      {savedScenes.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold text-cyan-400 mt-12 mb-4">Bối Cảnh Đã Lưu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {savedScenes.map((scene) => (
              <div 
                key={scene.id} 
                className="relative group rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
              >
                  <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDownloadScene(e, scene)}
                      className="p-1.5 bg-black/50 rounded-full text-white hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      aria-label="Tải xuống cảnh"
                      title="Tải xuống cảnh"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSceneClick(e, scene.id)}
                      className="p-1.5 bg-black/50 rounded-full text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Xóa cảnh"
                      title="Xóa cảnh"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                <img src={scene.imageUrl} alt={scene.prompt} className="w-full h-full object-cover aspect-video" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-3 w-full">
                  <p className="text-xs text-gray-300 truncate" title={scene.prompt}>{scene.prompt || 'Cảnh đã lưu'}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default CharacterLibrary;