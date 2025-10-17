import React, { useState } from 'react';
import type { Character, AspectRatio, SuggestionCategory, PhoneBrandRatios } from '../types';
import { STANDARD_ASPECT_RATIOS, PHONE_WALLPAPER_ASPECT_RATIOS, PRODUCT_SERVICES } from '../constants';
import { getSuggestions } from '../services/geminiService';
import { WandSparklesIcon, ChevronLeftIcon, LightbulbIcon } from './icons';

interface SceneGeneratorProps {
  characters: Character[];
  prompt: string;
  onPromptChange: (prompt: string) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onGenerate: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  apiKey: string;
}

const SceneGenerator: React.FC<SceneGeneratorProps> = ({
  characters,
  prompt,
  onPromptChange,
  aspectRatio,
  onAspectRatioChange,
  onGenerate,
  onBack,
  isLoading,
  error,
  apiKey,
}) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionCategory[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const [ratioCategory, setRatioCategory] = useState<'standard' | 'phone'>('standard');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
      if (!selectedProduct) return;
      setIsSuggesting(true);
      setSuggestionError(null);
      setSuggestions([]);
      try {
        const characterDescriptions = characters.map(c => c.name).join(' và ');
        const userPrompt = `Yêu cầu: Dựa trên (các) nhân vật '${characterDescriptions}', hãy tạo các gợi ý mô tả 'bối cảnh' quảng cáo. Chỉ trả về một đối tượng JSON có khóa 'categories' chứa một mảng các đối tượng, mỗi đối tượng có khóa 'name' (tên danh mục) và 'suggestions' (mảng các chuỗi gợi ý).`;
        const result = await getSuggestions(apiKey, userPrompt, selectedProduct);
        setSuggestions(result);
      } catch (err: any) {
        setSuggestionError(err.message || 'Không thể lấy gợi ý.');
      } finally {
        setIsSuggesting(false);
      }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
      onPromptChange(prompt ? `${prompt}. ${suggestion}` : suggestion);
  };

  const selectedBrandModels = selectedBrand
    ? PHONE_WALLPAPER_ASPECT_RATIOS.find(b => b.brand === selectedBrand)?.models
    : [];

  return (
     <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 mr-4">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-white">Tạo Bối Cảnh</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel: Character */}
        <div className="md:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Nhân Vật Được Chọn ({characters.length})</h2>
          <div className="grid grid-cols-2 gap-3">
            {characters.map(char => (
                <div key={char.id}>
                    <div className="aspect-[3/4] rounded-lg overflow-hidden">
                        <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-sm font-bold mt-2 text-white truncate">{char.name}</h3>
                </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Scene Details */}
        <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">1. Mô tả bối cảnh</h2>
          
          <div className="bg-gray-700/50 p-3 rounded-md mb-4">
              <label htmlFor="product-select-scene" className="text-sm font-medium text-cyan-400 block mb-2">Chọn sản phẩm để nhận gợi ý bối cảnh:</label>
              <div className="flex items-center gap-2">
                  <select 
                      id="product-select-scene"
                      value={selectedProduct} 
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                      <option value="">-- Chọn một tùy chọn --</option>
                      {PRODUCT_SERVICES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button 
                      onClick={handleGetSuggestions} 
                      disabled={isSuggesting || !selectedProduct}
                      className="flex-shrink-0 flex items-center text-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-md font-semibold"
                  >
                      <LightbulbIcon className="w-4 h-4 mr-1.5" />
                      <span>{isSuggesting ? 'Đang tải...' : 'Gợi ý'}</span>
                  </button>
              </div>
          </div>

          <textarea 
            placeholder='Ví dụ: "đang ngồi trong một quán cà phê ấm cúng vào ban đêm", "đứng trên đỉnh núi tuyết", "studio chụp ảnh thời trang với ánh đèn neon"...'
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={5}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />

          {isSuggesting && (
              <div className="text-center text-sm text-gray-400 mt-2">Đang lấy gợi ý từ chuyên gia marketing AI...</div>
          )}

          {suggestionError && (
              <p className="text-red-400 text-xs text-center mt-2">{suggestionError}</p>
          )}

          {suggestions.length > 0 && (
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mt-4">
                  {suggestions.map((category) => (
                      <div key={category.name}>
                          <h4 className="text-sm font-semibold text-cyan-400 mb-2">{category.name}</h4>
                          <div className="flex flex-wrap gap-2">
                              {category.suggestions.map((s, i) => (
                                  <button 
                                      key={i} 
                                      onClick={() => handleSuggestionClick(s)}
                                      className="px-3 py-1.5 bg-gray-600 hover:bg-cyan-700 text-white text-sm rounded-full transition-colors text-left"
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
          
          <h2 className="text-xl font-semibold mt-6 mb-4 text-cyan-400">2. Chọn tỷ lệ khung hình</h2>
          <div className="flex border border-gray-600 rounded-lg p-1 bg-gray-700 mb-4">
            <button
              onClick={() => setRatioCategory('standard')}
              className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${ratioCategory === 'standard' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
            >
              Tỷ lệ chuẩn
            </button>
            <button
              onClick={() => { setRatioCategory('phone'); setSelectedBrand(null); }}
              className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${ratioCategory === 'phone' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
            >
              Hình nền điện thoại
            </button>
          </div>

          {ratioCategory === 'standard' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {STANDARD_ASPECT_RATIOS.map((ratio) => (
                <button 
                  key={ratio.label}
                  onClick={() => onAspectRatioChange(ratio)}
                  className={`p-3 border-2 rounded-md text-sm font-medium transition-colors ${aspectRatio.value === ratio.value && aspectRatio.label === ratio.label ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-700 border-gray-600 hover:border-cyan-600'}`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          )}

          {ratioCategory === 'phone' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Chọn hãng điện thoại:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {PHONE_WALLPAPER_ASPECT_RATIOS.map((brandInfo) => (
                    <button
                      key={brandInfo.brand}
                      onClick={() => setSelectedBrand(brandInfo.brand)}
                      className={`p-2 border-2 rounded-md text-xs font-semibold transition-colors ${selectedBrand === brandInfo.brand ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-700 border-gray-600 hover:border-cyan-600'}`}
                    >
                      {brandInfo.brand}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBrand && selectedBrandModels && (
                <div className="border-t border-gray-700 pt-4">
                   <p className="text-sm font-medium text-gray-300 mb-2">Chọn model cho {selectedBrand}:</p>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedBrandModels.map((ratio) => (
                        <button
                          key={ratio.label}
                          onClick={() => onAspectRatioChange(ratio)}
                          className={`p-3 border-2 rounded-md text-sm font-medium transition-colors ${aspectRatio.value === ratio.value && aspectRatio.label === ratio.label ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-700 border-gray-600 hover:border-cyan-600'}`}
                        >
                           {ratio.label}
                        </button>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}


          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
          
          <div className="mt-8">
            <button 
              onClick={onGenerate} 
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : <WandSparklesIcon className="w-6 h-6 mr-2" />}
              {isLoading ? 'AI đang sáng tạo...' : 'Tạo Bối Cảnh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneGenerator;