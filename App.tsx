import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { AppView, Character, AspectRatio } from './types';
import CharacterLibrary from './components/CharacterLibrary';
import CharacterCreator from './components/CharacterCreator';
import SceneGenerator from './components/SceneGenerator';
import ResultViewer from './components/ResultViewer';
import ApiKeyModal from './components/ApiKeyModal'; // Import new component
import { ASPECT_RATIOS } from './constants';
import { generateSceneWithCharacter, initializeGemini } from './services/geminiService'; // Import initializer
import { base64ToImageData } from './utils/fileUtils';

// A simple component to show a global error, e.g., if the API key is invalid.
const GlobalError: React.FC<{ message: string; onClear: () => void }> = ({ message, onClear }) => (
    <div className="fixed top-5 right-5 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-4">
        <span>{message}</span>
        <button onClick={onClear} className="font-bold text-lg">&times;</button>
    </div>
);


const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini_api_key'));
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      try {
        initializeGemini(apiKey);
      } catch (error: any) {
        console.error("Failed to initialize Gemini:", error);
        setGlobalError("Không thể khởi tạo dịch vụ AI. Vui lòng kiểm tra API Key.");
        localStorage.removeItem('gemini_api_key');
        setApiKey(null);
      }
    }
  }, [apiKey]);

  const handleSaveApiKey = (key: string) => {
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key);
      setApiKey(key);
      setGlobalError(null); // Clear error on new key
    }
  };

  const [view, setView] = useState<AppView>('library');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);

  // State for SceneGenerator
  const [scenePrompt, setScenePrompt] = useState('');
  const [sceneAspectRatio, setSceneAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);

  const handleSaveCharacter = useCallback((character: Character) => {
    const existingIndex = characters.findIndex(c => c.id === character.id);
    if (existingIndex !== -1) {
      // Update existing character
      const updatedCharacters = [...characters];
      updatedCharacters[existingIndex] = character;
      setCharacters(updatedCharacters);
    } else {
      // Add new character
      setCharacters(prev => [...prev, character]);
    }
    setCharacterToEdit(null); // Reset editing state
    setView('library');
  }, [characters]);

  const handleStartEditCharacter = useCallback((id: string) => {
    const charToEdit = characters.find(c => c.id === id);
    if (charToEdit) {
        setCharacterToEdit(charToEdit);
        setView('createCharacter');
    }
  }, [characters]);
  
  const handleSelectCharacter = useCallback((id: string) => {
    setSelectedCharacterIds(prevIds =>
      prevIds.includes(id)
        ? prevIds.filter(prevId => prevId !== id)
        : [...prevIds, id]
    );
  }, []);
  
  const selectedCharacters = useMemo(() => {
    return characters.filter(c => selectedCharacterIds.includes(c.id));
  }, [characters, selectedCharacterIds]);

  const handleGenerateScene = async () => {
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
        const resultImage = await generateSceneWithCharacter(characterImageData, fullPrompt);
        setGeneratedImage(resultImage);
        setView('results');
    } catch (err: any) {
        if (err.message.includes('API key not valid')) {
             setGlobalError('API Key không hợp lệ. Vui lòng nhập lại.');
             localStorage.removeItem('gemini_api_key');
             setApiKey(null);
        } else {
            setSceneError(err.message || 'Đã xảy ra lỗi khi tạo bối cảnh.');
        }
    } finally {
        setIsLoading(false);
    }
  };
  
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
            onSave={handleSaveCharacter} 
            onCancel={() => {
                setCharacterToEdit(null);
                setView('library');
            }} 
            characterToEdit={characterToEdit}
        />;
      case 'createScene':
        if (selectedCharacters.length === 0) {
          setView('library');
          return null;
        }
        return (
          <SceneGenerator 
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
        return <ResultViewer image={generatedImage} onEdit={() => setView('createScene')} onNew={handleNewCreation} />;
      case 'library':
      default:
        return (
          <CharacterLibrary 
            characters={characters}
            selectedCharacterIds={selectedCharacterIds}
            onSelectCharacter={handleSelectCharacter}
            onCreateCharacter={() => setView('createCharacter')}
            onGenerateScene={() => {
              setSceneError(null); // Clear previous errors when starting a new scene generation
              setView('createScene')
            }}
            onEditCharacter={handleStartEditCharacter}
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      {globalError && <GlobalError message={globalError} onClear={() => setGlobalError(null)} />}
      {!apiKey ? (
          <ApiKeyModal onSave={handleSaveApiKey} />
      ) : (
          renderView()
      )}
    </main>
  );
};

export default App;
