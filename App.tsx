import React, { useState, useCallback, useMemo } from 'react';
import type { AppView, Character, AspectRatio } from './types';
import CharacterLibrary from './components/CharacterLibrary';
import CharacterCreator from './components/CharacterCreator';
import SceneGenerator from './components/SceneGenerator';
import ResultViewer from './components/ResultViewer';
import { ASPECT_RATIOS } from './constants';
import { generateSceneWithCharacter } from './services/geminiService';
import { base64ToImageData } from './utils/fileUtils';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('library');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // State for SceneGenerator
  const [scenePrompt, setScenePrompt] = useState('');
  const [sceneAspectRatio, setSceneAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);

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
        setSceneError(err.message || 'Đã xảy ra lỗi khi tạo bối cảnh.');
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
        return <CharacterCreator onSave={handleSaveCharacter} onCancel={() => setView('library')} />;
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
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      {renderView()}
    </main>
  );
};

export default App;