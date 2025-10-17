import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { AppView, Character, AspectRatio, Scene, StorageMode } from './types';
import CharacterLibrary from './components/CharacterLibrary';
import CharacterCreator from './components/CharacterCreator';
import SceneGenerator from './components/SceneGenerator';
import ResultViewer from './components/ResultViewer';
import ConfirmationModal from './components/ConfirmationModal';
import SceneConfirmationModal from './components/SceneConfirmationModal';
import ApiKeyModal from './components/ApiKeyModal';
import SettingsModal from './components/SettingsModal';
import StorageSelectionModal from './components/StorageSelectionModal';
// FIX: Changed ASPECT_RATIOS to STANDARD_ASPECT_RATIOS to match the export from constants.ts.
import { STANDARD_ASPECT_RATIOS } from './constants';
import { generateSceneWithCharacter } from './services/geminiService';
import { storageService } from './services/storageService';
import { base64ToImageData } from './utils/fileUtils';
import { AlertTriangleIcon, XIcon } from './components/icons';

const API_KEY_STORAGE_KEY = 'gemini-api-key';
const STORAGE_MODE_KEY = 'storage-mode';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('library');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [savedScenes, setSavedScenes] = useState<Scene[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [scenePrompt, setScenePrompt] = useState('');
  // FIX: Changed ASPECT_RATIOS to STANDARD_ASPECT_RATIOS to match the import change.
  const [sceneAspectRatio, setSceneAspectRatio] = useState<AspectRatio>(STANDARD_ASPECT_RATIOS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);

  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
  
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // --- New State for Storage & Auth ---
  const [storageMode, setStorageMode] = useState<StorageMode>('unselected');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- Initialize APIs and Load Initial Data ---
  useEffect(() => {
    // Load API Key
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) setApiKey(storedKey);

    // Initialize Google APIs
    const init = async () => {
      try {
        await storageService.initGoogleApis();
        setIsAuthReady(true);
      } catch (e) {
        console.error("Error initializing Google APIs", e);
        setStorageError("Không thể kết nối đến dịch vụ của Google.");
      }
    };
    init();

    // Determine storage mode
    const mode = localStorage.getItem(STORAGE_MODE_KEY) as StorageMode | null;
    if (mode) {
      setStorageMode(mode);
    } else {
      setStorageMode('unselected');
      setIsDataLoading(false); // No data to load yet
    }
  }, []);
  
  // --- Load data based on storage mode ---
  useEffect(() => {
      if (storageMode === 'unselected' || !isAuthReady) return;

      const loadData = async () => {
        setIsDataLoading(true);
        try {
          const { characters, scenes } = await storageService.loadData(storageMode);
          setCharacters(characters);
          setSavedScenes(scenes);
        } catch (error) {
           console.error(`Failed to load data from ${storageMode}`, error);
           setStorageError(`Không thể tải dữ liệu từ ${storageMode === 'drive' ? 'Google Drive' : 'thiết bị'}.`);
        } finally {
            setIsDataLoading(false);
        }
      };
      
      loadData();
  }, [storageMode, isAuthReady, isAuthenticated]);


  // --- Data Persistence using storageService ---
  const saveData = useCallback(async () => {
    if (storageMode === 'unselected' || isDataLoading) return;
    try {
        await storageService.saveData(storageMode, { characters, scenes: savedScenes });
        if (storageError) setStorageError(null);
    } catch (error: any) {
        console.error(`Failed to save data to ${storageMode}`, error);
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            setStorageError("Dung lượng lưu trữ cục bộ đã đầy. Không thể lưu các thay đổi mới.");
        } else {
            setStorageError(`Không thể lưu dữ liệu vào ${storageMode === 'drive' ? 'Google Drive' : 'thiết bị'}.`);
        }
    }
  }, [characters, savedScenes, storageMode, storageError, isDataLoading]);

  // Auto-save whenever data changes
  useEffect(() => {
      const handler = setTimeout(() => {
          saveData();
      }, 1000); // Debounce saving
      return () => clearTimeout(handler);
  }, [characters, savedScenes, saveData]);


  // --- Auth Handlers ---
  const handleSignIn = useCallback(async () => {
    try {
      await storageService.signIn();
      setIsAuthenticated(true);
      const profile = await window.gapi.client.oauth2.userinfo.get();
      setUserProfile(profile.result);
      setStorageMode('drive'); // Automatically switch to drive on successful sign-in
      localStorage.setItem(STORAGE_MODE_KEY, 'drive');
    } catch (error) {
      console.error("Sign in failed", error);
    }
  }, []);

  const handleSignOut = useCallback(() => {
    storageService.signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setStorageMode('local'); // Revert to local storage on sign out
    localStorage.setItem(STORAGE_MODE_KEY, 'local');
    alert("Bạn đã đăng xuất và dữ liệu sẽ được lưu trên thiết bị này.");
  }, []);
  
  // --- Storage Mode Handlers ---
  const handleSelectStorageMode = (mode: 'local' | 'drive') => {
      if (mode === 'drive') {
          if (isAuthenticated) {
              setStorageMode('drive');
              localStorage.setItem(STORAGE_MODE_KEY, 'drive');
          } else {
              handleSignIn();
          }
      } else {
          setStorageMode('local');
          localStorage.setItem(STORAGE_MODE_KEY, 'local');
      }
  };
  
  const handleSwitchToLocal = () => {
      if (window.confirm("Bạn có chắc muốn chuyển sang lưu cục bộ? Dữ liệu sẽ không được đồng bộ nữa.")) {
          setStorageMode('local');
          localStorage.setItem(STORAGE_MODE_KEY, 'local');
      }
  };

  const handleSwitchToDrive = () => {
      setStorageMode('drive');
      localStorage.setItem(STORAGE_MODE_KEY, 'drive');
  };
  
  // --- Core App Logic (mostly unchanged) ---
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    setApiKeyError(null);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  };
  
  const handleClearAllData = useCallback(async () => {
    if (storageMode === 'unselected') return;
    try {
      await storageService.clearData(storageMode);
      setCharacters([]);
      setSavedScenes([]);
      setSelectedCharacterIds([]);
      setStorageError(null);
      setIsSettingsModalOpen(false);
    } catch (error) {
      console.error("Failed to clear data", error);
      setStorageError("Không thể xóa dữ liệu.");
    }
  }, [storageMode]);

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
    if (character) setCharacterToDelete(character);
  }, [characters]);

  const handleConfirmDelete = useCallback(() => {
    if (characterToDelete) {
      setCharacters(prev => prev.filter(c => c.id !== characterToDelete.id));
      setSelectedCharacterIds(prev => prev.filter(id => id !== characterToDelete.id));
      setCharacterToDelete(null);
    }
  }, [characterToDelete]);

  const handleCancelDelete = useCallback(() => setCharacterToDelete(null), []);
  
  const selectedCharacters = useMemo(() => {
    return characters.filter(c => selectedCharacterIds.includes(c.id));
  }, [characters, selectedCharacterIds]);

  const handleGenerateScene = async () => {
    if (!apiKey) return;
    if (!scenePrompt.trim()) { setSceneError('Vui lòng nhập mô tả bối cảnh.'); return; }
    
    setIsLoading(true);
    setSceneError(null);
    const fullPrompt = `Tạo một hình ảnh nghệ thuật với tỷ lệ khung hình ${sceneAspectRatio.value}. Trong hình, ${selectedCharacters.length > 1 ? 'các nhân vật được cung cấp' : 'nhân vật được cung cấp'} đang ở trong một bối cảnh được mô tả là: "${scenePrompt}". Giữ nguyên hoàn toàn ngoại hình của (các) nhân vật từ (các) hình ảnh gốc và phối hợp họ vào bối cảnh mới một cách liền mạch.`;

    try {
        const characterImageData = selectedCharacters.map(char => base64ToImageData(char.imageUrl));
        const resultImage = await generateSceneWithCharacter(apiKey, characterImageData, fullPrompt);
        setGeneratedImage(resultImage);
        setView('results');
    } catch (err: any) {
        const errorMessage = err.message || 'Đã xảy ra lỗi.';
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
    if (scene) setSceneToDelete(scene);
  }, [savedScenes]);

  const handleConfirmDeleteScene = useCallback(() => {
    if (sceneToDelete) {
      setSavedScenes(prev => prev.filter(s => s.id !== sceneToDelete.id));
      setSceneToDelete(null);
    }
  }, [sceneToDelete]);

  const handleCancelDeleteScene = useCallback(() => setSceneToDelete(null), []);
  
  const handleNewCreation = () => {
    setSelectedCharacterIds([]);
    setGeneratedImage(null);
    setScenePrompt('');
    // FIX: Changed ASPECT_RATIOS to STANDARD_ASPECT_RATIOS to match the import change.
    setSceneAspectRatio(STANDARD_ASPECT_RATIOS[0]);
    setSceneError(null);
    setView('library');
  };

  const renderView = () => {
    if (isDataLoading) {
      return <div className="flex justify-center items-center h-screen text-lg">Đang tải dữ liệu...</div>
    }
    switch (view) {
      case 'createCharacter':
        return <CharacterCreator apiKey={apiKey!} onSave={handleSaveCharacter} onCancel={() => setView('library')} onInvalidApiKey={() => { localStorage.removeItem(API_KEY_STORAGE_KEY); setApiKey(null); setApiKeyError("API Key không hợp lệ. Vui lòng nhập lại."); }} />;
      case 'createScene':
        return <SceneGenerator apiKey={apiKey!} characters={selectedCharacters} prompt={scenePrompt} onPromptChange={setScenePrompt} aspectRatio={sceneAspectRatio} onAspectRatioChange={setSceneAspectRatio} onGenerate={handleGenerateScene} onBack={() => setView('library')} isLoading={isLoading} error={sceneError} />;
      case 'results':
        return <ResultViewer image={generatedImage!} onEdit={() => setView('createScene')} onNew={handleNewCreation} onSaveScene={handleSaveScene} />;
      default:
        return <CharacterLibrary characters={characters} savedScenes={savedScenes} selectedCharacterIds={selectedCharacterIds} onSelectCharacter={handleSelectCharacter} onCreateCharacter={() => setView('createCharacter')} onGenerateScene={() => { setSceneError(null); setView('createScene') }} onDeleteCharacter={handleDeleteCharacter} onDeleteScene={handleDeleteScene} onOpenSettings={() => setIsSettingsModalOpen(true)} />;
    }
  };

  if (!apiKey) return <ApiKeyModal onSave={handleSaveApiKey} initialError={apiKeyError || undefined} />;
  if (storageMode === 'unselected') return <StorageSelectionModal onSelect={handleSelectStorageMode} />;

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      {storageError && (
        <div className="bg-yellow-500/20 border-l-4 border-yellow-500 text-yellow-300 p-4 sticky top-0 z-50 flex justify-between items-center" role="alert">
          <div className="flex items-center"><AlertTriangleIcon className="h-6 w-6 mr-3"/><div><p className="font-bold">Lỗi</p><p className="text-sm">{storageError}</p></div></div>
          <button onClick={() => setStorageError(null)} className="p-1 rounded-md hover:bg-yellow-500/30"><XIcon className="h-5 w-5"/></button>
        </div>
      )}
      {renderView()}
      {characterToDelete && <ConfirmationModal character={characterToDelete} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />}
      {sceneToDelete && <SceneConfirmationModal scene={sceneToDelete} onConfirm={handleConfirmDeleteScene} onCancel={handleCancelDeleteScene} />}
      {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onClearData={handleClearAllData} characterCount={characters.length} sceneCount={savedScenes.length} storageMode={storageMode} isAuthenticated={isAuthenticated} onSignIn={handleSignIn} onSignOut={handleSignOut} user={userProfile} onSwitchToLocal={handleSwitchToLocal} onSwitchToDrive={handleSwitchToDrive} />}
    </main>
  );
};

export default App;
