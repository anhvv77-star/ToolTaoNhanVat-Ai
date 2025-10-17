import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { AppView, Character, AspectRatio, Scene } from './types';
import CharacterLibrary from './components/CharacterLibrary';
import CharacterCreator from './components/CharacterCreator';
import SceneGenerator from './components/SceneGenerator';
import ResultViewer from './components/ResultViewer';
import ConfirmationModal from './components/ConfirmationModal';
import SceneConfirmationModal from './components/SceneConfirmationModal';
import ApiKeyModal from './components/ApiKeyModal';
import SettingsModal from './components/SettingsModal';
import { ASPECT_RATIOS } from './constants';
import { generateSceneWithCharacter } from './services/geminiService';
import { base64ToImageData } from './utils/fileUtils';
import { AlertTriangleIcon, XIcon } from './components/icons';

const API_KEY_STORAGE_KEY = 'gemini-api-key';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('library');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [savedScenes, setSavedScenes] = useState<Scene[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // State for SceneGenerator
  const [scenePrompt, setScenePrompt] = useState('');
  const [sceneAspectRatio, setSceneAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);

  // State for delete confirmation
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
  
  // State for storage error
  const [storageError, setStorageError] = useState<string | null>(null);

  // State for settings modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // --- API Key Persistence ---
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    setApiKeyError(null);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  };
  
  // --- Data Persistence ---
  useEffect(() => {
    try {
      const storedCharacters = localStorage.getItem('ai-characters');
      if (storedCharacters) setCharacters(JSON.parse(storedCharacters));
      
      const storedScenes = localStorage.getItem('ai-saved-scenes');
      if (storedScenes) setSavedScenes(JSON.parse(storedScenes));
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ai-characters', JSON.stringify(characters));
      if (storageError) setStorageError(null);
    } catch (error: any) {
      console.error("Failed to save characters to localStorage", error);
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          setStorageError("Dung lượng lưu trữ cục bộ đã đầy. Không thể lưu các thay đổi mới. Vui lòng xóa bớt nhân vật hoặc cảnh cũ để giải phóng dung lượng.");
      }
    }
  }, [characters]);

  useEffect(() => {
    try {
      localStorage.setItem('ai-saved-scenes', JSON.stringify(savedScenes));
      if (storageError) setStorageError(null);
    } catch (error: any) {
      console.error("Failed to save scenes to localStorage", error);
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          setStorageError("Dung lượng lưu trữ cục bộ đã đầy. Không thể lưu các thay đổi mới. Vui lòng xóa bớt nhân vật hoặc cảnh cũ để giải phóng dung lượng.");
      }
    }
  }, [savedScenes]);
  // --- End Data Persistence ---
  
  const handleClearAllData = useCallback(() => {
    try {
      localStorage.removeItem('ai-characters');
      localStorage.removeItem('ai-saved-scenes');
      setCharacters([]);
      setSavedScenes([]);
      setSelectedCharacterIds([]);
      setStorageError(null); // Clear the error message
      setIsSettingsModalOpen(false);
    } catch (error) {
      console.error("Failed to clear local storage", error);
      setStorageError("Không thể xóa dữ liệu. Vui lòng thử xóa thủ công bộ nhớ cache của trình duyệt.");
    }
  }, []);

  const handleSaveCharacter = useCallback((character: Character) => {
    setCharacters(prev => [...prev, character]);
    setView('library');
  }, []);
  
  const handleSelectCharacter = useCallback((id: string) => {
    setSelectedCharacterIds(prevIds =>
      prevIds.includes(id)
        ? prevIds.filter(prevId => prevId !== id)
        : [...prevIds, id]
    );
  }, []);

  const handleDeleteCharacter = useCallback((id: string) => {
    const character = characters.find(c => c.id === id);
    if (character) {
      setCharacterToDelete(character);
    }
  }, [characters]);

  const handleConfirmDelete = useCallback(() => {
    if (characterToDelete) {
      setCharacters(prev => prev.filter(c => c.id !== characterToDelete.id));
      setSelectedCharacterIds(prev => prev.filter(id => id !== characterToDelete.id));
      setCharacterToDelete(null);
    }
  }, [characterToDelete]);

  const handleCancelDelete = useCallback(() => {
    setCharacterToDelete(null);
  }, []);
  
  const selectedCharacters = useMemo(() => {
    return characters.filter(c => selectedCharacterIds.includes(c.id));
  }, [characters, selectedCharacterIds]);

  const handleGenerateScene = async () => {
    if (!apiKey) {
      setSceneError('Lỗi: API Key không được tìm thấy. Vui lòng làm mới trang và nhập lại.');
      return;
    }
    if (!scenePrompt.trim()) {
      setSceneError('Vui lòng nhập mô tả bối cảnh.');
      return;
    }
    
    setIsLoading(true);
    setSceneError(null);

    const characterDescription = selectedCharacters.length > 1 
      ? 'các nhân vật được cung cấp' 
      : 'nhân vật được cung cấp';

    const fullPrompt = `Tạo một hình ảnh nghệ thuật với tỷ lệ khung hình ${sceneAspectRatio.value}. Trong hình, ${characterDescription} đang ở trong một bối cảnh được mô tả là: "${scenePrompt}". Giữ nguyên hoàn toàn ngoại hình của (các) nhân vật từ (các) hình ảnh gốc và phối hợp họ vào bối cảnh mới một cách liền mạch, chú ý đến ánh sáng, bóng đổ và phối cảnh tự nhiên.`;

    try {
        const characterImageData = selectedCharacters.map(char => base64ToImageData(char.imageUrl));
        const resultImage = await generateSceneWithCharacter(apiKey, characterImageData, fullPrompt);
        setGeneratedImage(resultImage);
        setView('results');
    } catch (err: any) {
        const errorMessage = err.message || 'Đã xảy ra lỗi khi tạo bối cảnh.';
        setSceneError(errorMessage);
        if (errorMessage.includes('API Key không hợp lệ')) {
          localStorage.removeItem(API_KEY_STORAGE_KEY);
          setApiKey(null);
          setApiKeyError(errorMessage);
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveScene = useCallback(() => {
    if (!generatedImage) return;
    const newScene: Scene = {
      id: crypto.randomUUID(),
      imageUrl: generatedImage,
      prompt: scenePrompt,
      characterIds: selectedCharacterIds,
    };
    setSavedScenes(prev => [newScene, ...prev]);
    setView('library');
  }, [generatedImage, scenePrompt, selectedCharacterIds]);

  const handleDeleteScene = useCallback((id: string) => {
    const scene = savedScenes.find(s => s.id === id);
    if (scene) {
      setSceneToDelete(scene);
    }
  }, [savedScenes]);

  const handleConfirmDeleteScene = useCallback(() => {
    if (sceneToDelete) {
      setSavedScenes(prev => prev.filter(s => s.id !== sceneToDelete.id));
      setSceneToDelete(null);
    }
  }, [sceneToDelete]);

  const handleCancelDeleteScene = useCallback(() => {
    setSceneToDelete(null);
  }, []);
  
  const handleNewCreation = () => {
    setSelectedCharacterIds([]);
    setGeneratedImage(null);
    setScenePrompt('');
    setSceneAspectRatio(ASPECT_RATIOS[0]);
    setSceneError(null);
    setView('library');
  };

  const renderView = () => {
    switch (view) {
      case 'createCharacter':
        return <CharacterCreator 
                  apiKey={apiKey!} 
                  onSave={handleSaveCharacter} 
                  onCancel={() => setView('library')} 
                  onInvalidApiKey={() => {
                     localStorage.removeItem(API_KEY_STORAGE_KEY);
                     setApiKey(null);
                     setApiKeyError("API Key của bạn không hợp lệ hoặc đã hết hạn. Vui lòng nhập lại.");
                  }}
                />;
      case 'createScene':
        if (selectedCharacters.length === 0) {
          setView('library');
          return null;
        }
        return (
          <SceneGenerator 
            apiKey={apiKey!}
            characters={selectedCharacters} 
            prompt={scenePrompt}
            onPromptChange={setScenePrompt}
            aspectRatio={sceneAspectRatio}
            onAspectRatioChange={setSceneAspectRatio}
            onGenerate={handleGenerateScene}
            onBack={() => setView('library')} 
            isLoading={isLoading}
            error={sceneError}
          />
        );
      case 'results':
        if (!generatedImage) {
            setView('library');
            return null;
        }
        return <ResultViewer image={generatedImage} onEdit={() => setView('createScene')} onNew={handleNewCreation} onSaveScene={handleSaveScene} />;
      case 'library':
      default:
        return (
          <CharacterLibrary 
            characters={characters}
            savedScenes={savedScenes}
            selectedCharacterIds={selectedCharacterIds}
            onSelectCharacter={handleSelectCharacter}
            onCreateCharacter={() => setView('createCharacter')}
            onGenerateScene={() => {
              setSceneError(null); // Clear previous errors when starting a new scene generation
              setView('createScene')
            }}
            onDeleteCharacter={handleDeleteCharacter}
            onDeleteScene={handleDeleteScene}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        );
    }
  };

  if (!apiKey) {
    return <ApiKeyModal onSave={handleSaveApiKey} initialError={apiKeyError || undefined} />;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      {storageError && (
        <div className="bg-yellow-500/20 border-l-4 border-yellow-500 text-yellow-300 p-4 sticky top-0 z-50 flex justify-between items-center" role="alert">
          <div className="flex items-center">
            <AlertTriangleIcon className="h-6 w-6 mr-3"/>
            <div>
              <p className="font-bold">Lỗi Lưu Trữ</p>
              <p className="text-sm">{storageError}</p>
            </div>
          </div>
          <button onClick={() => setStorageError(null)} className="p-1 rounded-md hover:bg-yellow-500/30">
            <XIcon className="h-5 w-5"/>
          </button>
        </div>
      )}
      {renderView()}
      {characterToDelete && (
        <ConfirmationModal
          character={characterToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
      {sceneToDelete && (
        <SceneConfirmationModal
          scene={sceneToDelete}
          onConfirm={handleConfirmDeleteScene}
          onCancel={handleCancelDeleteScene}
        />
      )}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onClearData={handleClearAllData}
          characterCount={characters.length}
          sceneCount={savedScenes.length}
        />
      )}
    </main>
  );
};

export default App;