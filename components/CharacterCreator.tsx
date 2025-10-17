import React, { useState, useEffect } from 'react';
import type { Character, SuggestionCategory } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { getSuggestions, generateImageFromPrompt } from '../services/geminiService';
import { UploadCloudIcon, WandSparklesIcon, ChevronLeftIcon, LightbulbIcon } from './icons';

interface CharacterCreatorProps {
  onSave: (character: Character) => void;
  onCancel: () => void;
  apiKey: string;
  onInvalidApiKey: () => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, onCancel, apiKey, onInvalidApiKey }) => {
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

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionCategory[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

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
    
    let fullPrompt = `Một bức ảnh chân dung theo phong cách ${style} của một nhân vật ${gender}, khoảng ${age} tuổi, đang mặc ${outfit} với biểu cảm ${expression}.`;
    if (prompt.trim()) {
      fullPrompt += ` Các đặc điểm bổ sung: ${prompt}.`;
    }
    fullPrompt += ' Nhân vật được hiển thị trên nền trắng đơn giản để dễ dàng tách nền.';

    try {
      const imageUrl = await generateImageFromPrompt(apiKey, fullPrompt);
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      const errorMessage = err.message || 'Đã xảy ra lỗi khi tạo nhân vật.';
      setError(errorMessage);
      if (errorMessage.includes('API Key không hợp lệ')) {
        onInvalidApiKey();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGetSuggestions = async () => {
    setIsSuggesting(true);
    setSuggestionError(null);
    setSuggestions([]);
    try {
      const userPrompt = "Yêu cầu: Hãy tạo các gợi ý mô tả 'nhân vật' đại diện cho các sản phẩm và dịch vụ đó. Chỉ trả về một đối tượng JSON có khóa 'categories' chứa một mảng các đối tượng, mỗi đối tượng có khóa 'name' (tên danh mục) và 'suggestions' (mảng các chuỗi gợi ý).";
      const result = await getSuggestions(apiKey, userPrompt);
      setSuggestions(result);
    } catch (err: any) {
      setSuggestionError(err.message || 'Không thể lấy gợi ý.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(prev => prev ? `${prev}, ${suggestion}` : suggestion);
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
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name,
      imageUrl,
      style,
      gender,
      age,
      outfit,
      expression,
    };
    onSave(newCharacter);
  };
  
  const isSaveDisabled = isLoading || (!uploadedImage && !generatedImage) || !name.trim();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center mb-6">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-700 mr-4">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-white">Tạo Nhân Vật Mới</h1>
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
              <div className="flex justify-between items-center">
                  <label htmlFor="prompt-textarea" className="text-sm font-medium text-gray-300">Mô tả thêm về nhân vật</label>
                  <button 
                      onClick={handleGetSuggestions} 
                      disabled={isSuggesting}
                      className="flex items-center text-xs text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 disabled:cursor-wait"
                  >
                      <LightbulbIcon className="w-4 h-4 mr-1" />
                      {isSuggesting ? 'Đang tìm...' : 'Gợi ý Marketing'}
                  </button>
              </div>
              <textarea id="prompt-textarea" placeholder="VD: tóc vàng, mắt xanh, đeo kính..." value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"></textarea>
              
              {isSuggesting && (
                  <div className="text-center text-sm text-gray-400">Đang lấy gợi ý từ chuyên gia marketing AI...</div>
              )}

              {suggestionError && (
                  <p className="text-red-400 text-xs text-center">{suggestionError}</p>
              )}

              {suggestions.length > 0 && (
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                      {suggestions.map((category) => (
                          <div key={category.name}>
                              <h4 className="text-sm font-semibold text-cyan-400 mb-2">{category.name}</h4>
                              <div className="flex flex-wrap gap-2">
                                  {category.suggestions.map((s, i) => (
                                      <button 
                                          key={i} 
                                          onClick={() => handleSuggestionClick(s)}
                                          className="px-3 py-1 bg-gray-600 hover:bg-cyan-700 text-white text-xs rounded-full transition-colors text-left"
                                          title="Thêm gợi ý này"
                                      >
                                          {s}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}

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
             <button onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300">Hủy</button>
            <button onClick={handleSave} disabled={isSaveDisabled} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">Lưu Nhân Vật</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
