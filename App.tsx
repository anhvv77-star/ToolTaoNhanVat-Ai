import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { AppView, Character, AspectRatio } from './types';
import CharacterLibrary from './components/CharacterLibrary';
import CharacterCreator from './components/CharacterCreator';
import SceneGenerator from './components/SceneGenerator';
import ResultViewer from './components/ResultViewer';
import { ASPECT_RATIOS } from './constants';
import { generateSceneWithCharacter } from './services/geminiService';
import { base64ToImageData } from './utils/fileUtils';

const CHARACTERS_STORAGE_KEY = 'ai_character_library';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('library');
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const savedCharacters = localStorage.getItem(CHARACTERS_STORAGE_KEY);
      return savedCharacters ? JSON.parse(savedCharacters) : [];
    } catch (error) {
      console.error("Không thể tải nhân vật từ localStorage", error);
      return [];
    }
  });
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);

  // State for SceneGenerator
  const [scenePrompt, setScenePrompt] = useState('');
  const [sceneAspectRatio, setSceneAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);
  
  // Persist characters to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(characters));
    } catch (error) {
        console.error("Không thể lưu nhân vật vào localStorage", error);
    }
  }, [characters]);


  const handleSaveCharacter = useCallback((character: Character) => {
    setCharacters(prev => {
      const existingIndex = prev.findIndex(c => c.id === character.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = character;
        return updated;
      }
      return [...prev, character];
    });
    setCharacterToEdit(null);
    setView('library');
  }, []);

  const handleDeleteCharacter = useCallback((id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
    setSelectedCharacterIds(prev => prev.filter(selectedId => selectedId !== id));
  }, []);


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

    const fullPrompt = `Đặt ${characterDescription} vào bối cảnh được mô tả là: "${scenePrompt}". Giữ nguyên hoàn toàn ngoại hình và phong cách của nhân vật từ ảnh gốc. Hợp nhất nhân vật vào cảnh một cách liền mạch và chân thực. Tỷ lệ khung hình của ảnh phải là ${sceneAspectRatio.value}.`;

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
            onDeleteCharacter={handleDeleteCharacter}
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
