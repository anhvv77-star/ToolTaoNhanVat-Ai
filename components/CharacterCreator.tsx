import React, { useState, useEffect } from 'react';
import type { Character } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { generateImageFromPrompt } from '../services/geminiService';
import { UploadCloudIcon, WandSparklesIcon, ChevronLeftIcon } from './icons';

interface CharacterCreatorProps {
  onSave: (character: Character) => void;
  onCancel: () => void;
  characterToEdit?: Character | null;
}

const DRAFT_STORAGE_KEY = 'character_creator_draft';

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, onCancel, characterToEdit }) => {
  const [mode, setMode] = useState<'upload' | 'generate'>('generate');
  
  const [name, setName] = useState('');
  const [style, setStyle] = useState('Realistic');
  const [gender, setGender] = useState('Nữ');
  const [age, setAge] = useState('25');
  const [outfit, setOutfit] = useState('Trang phục công sở');
  const [expression, setExpression] = useState('Mỉm cười');
  
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (characterToEdit) {
      // Nạp dữ liệu khi chỉnh sửa nhân vật
      setName(characterToEdit.name);
      setStyle(characterToEdit.style);
      setGender(characterToEdit.gender);
      setAge(characterToEdit.age);
      setOutfit(characterToEdit.outfit);
      setExpression(characterToEdit.expression);
      setGeneratedImage(characterToEdit.imageUrl);
      setUploadedImage(null);
      setMode('generate');
    } else {
      // Nạp bản nháp đã lưu khi tạo nhân vật mới
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setName(draft.name || '');
          setStyle(draft.style || 'Realistic');
          setGender(draft.gender || 'Nữ');
          setAge(draft.age || '25');
          setOutfit(draft.outfit || 'Trang phục công sở');
          setExpression(draft.expression || 'Mỉm cười');
          setPrompt(draft.prompt || '');
        } catch (e) {
          console.error("Không thể phân tích bản nháp nhân vật từ localStorage", e);
          localStorage.removeItem(DRAFT_STORAGE_KEY); // Xóa dữ liệu bị hỏng
        }
      }
    }
  }, [characterToEdit]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setUploadedImage(base64);
        setGeneratedImage(null);
      } catch (err) {
        setError('Không thể tải ảnh lên.');
      }
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setUploadedImage(null);
    
    let fullPrompt = `Một bức ảnh chân dung chất lượng cao, theo phong cách ${style}. Nhân vật là ${gender}, khoảng ${age} tuổi, mặc ${outfit}, và có biểu cảm ${expression}.`;
    if (prompt.trim()) {
      fullPrompt += ` Các chi tiết bổ sung: ${prompt}.`;
    }
    fullPrompt += ' Nhân vật được chụp trên nền trắng đơn giản.';

    try {
      const imageUrl = await generateImageFromPrompt(fullPrompt);
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo nhân vật.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
        setError('Vui lòng nhập tên nhân vật.');
        return;
    }
    const imageUrl = mode === 'upload' ? uploadedImage : generatedImage;
    if (!imageUrl) {
      setError('Vui lòng tải lên hoặc tạo một hình ảnh.');
      return;
    }
    
    const characterData = {
      name,
      imageUrl,
      style,
      gender,
      age,
      outfit,
      expression,
    };

    const characterToSave: Character = characterToEdit
      ? { ...characterToEdit, ...characterData }
      : { id: crypto.randomUUID(), ...characterData };
    
    localStorage.removeItem(DRAFT_STORAGE_KEY); // Xóa bản nháp khi lưu thành công
    onSave(characterToSave);
  };

  const handleCancelAndSaveDraft = () => {
    // Chỉ lưu bản nháp khi tạo nhân vật mới, không lưu khi đang chỉnh sửa
    if (!characterToEdit) {
      const draft = {
        name,
        style,
        gender,
        age,
        outfit,
        expression,
        prompt,
      };
      // Chỉ lưu nếu có nội dung
      const isDraftEmpty = !Object.values(draft).some(value => typeof value === 'string' && value.trim() !== '');
      if (!isDraftEmpty) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY); // Xóa nếu biểu mẫu trống
      }
    }
    onCancel();
  };
  
  const isSaveDisabled = isLoading || (!uploadedImage && !generatedImage) || !name.trim();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center mb-6">
        <button onClick={handleCancelAndSaveDraft} className="p-2 rounded-full hover:bg-gray-700 mr-4">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-white">{characterToEdit ? 'Chỉnh Sửa Nhân Vật' : 'Tạo Nhân Vật Mới'}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Panel: Form */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">1. Thông tin nhân vật</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Tên nhân vật *" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                <option>Realistic</option>
                <option>Anime</option>
                <option>Cartoon</option>
                <option>Fantasy</option>
              </select>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                <option>Nữ</option>
                <option>Nam</option>
                <option>Khác</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <input type="text" placeholder="Tuổi" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
               <input type="text" placeholder="Trang phục" value={outfit} onChange={(e) => setOutfit(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
            </div>
            <input type="text" placeholder="Biểu cảm" value={expression} onChange={(e) => setExpression(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-cyan-400">2. Nguồn ảnh</h2>
          <div className="flex border border-gray-600 rounded-lg p-1 bg-gray-700">
            <button onClick={() => setMode('generate')} className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'generate' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Tạo Bằng AI</button>
            <button onClick={() => setMode('upload')} className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Tải Lên Ảnh</button>
          </div>
          
          {mode === 'generate' ? (
            <div className="mt-4 space-y-4">
              <textarea placeholder="Mô tả thêm về nhân vật (VD: tóc vàng, mắt xanh, đeo kính...)" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"></textarea>
              <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isLoading ? (
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                ) : <WandSparklesIcon className="w-5 h-5 mr-2" />}
                {isLoading ? 'Đang tạo...' : 'Tạo nhân vật'}
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloudIcon className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả</p>
                      <p className="text-xs text-gray-400">PNG, JPG (Tối đa 5MB)</p>
                  </div>
                  <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg" />
              </label>
            </div>
          )}
        </div>

        {/* Right Panel: Preview */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">3. Xem trước & Lưu</h2>
          <div className="flex-grow bg-gray-900/50 rounded-md flex items-center justify-center aspect-square">
            {uploadedImage || generatedImage ? (
              <img src={uploadedImage || generatedImage!} alt="Xem trước nhân vật" className="max-h-full max-w-full object-contain rounded-md" />
            ) : (
              <div className="text-center text-gray-500">
                <WandSparklesIcon className="w-16 h-16 mx-auto mb-2" />
                <p>Hình ảnh sẽ hiển thị ở đây</p>
              </div>
            )}
          </div>
          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
          <div className="mt-6 flex space-x-4">
             <button onClick={handleCancelAndSaveDraft} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300">Hủy</button>
            <button onClick={handleSave} disabled={isSaveDisabled} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {characterToEdit ? 'Lưu Thay Đổi' : 'Lưu Nhân Vật'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;