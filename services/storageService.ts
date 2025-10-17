import type { Character, Scene } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Helper to load a script dynamically and return a promise
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If script already exists, don't load it again
    if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error(`Failed to load script: ${src}. Error: ${err}`));
    document.head.appendChild(script);
  });
};


// FIX: Hardcoded the provided Google Client ID to ensure it's always available.
const CLIENT_ID = '939227485257-jigsek0srr96jannl33hg18fsrmct9he.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DATA_FILE_NAME = 'ai-character-data.json';

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;
let initPromise: Promise<void> | null = null;

interface AppData {
  characters: Character[];
  scenes: Scene[];
}

// --- Local Storage Implementation ---
const getLocalData = (): AppData => {
  try {
    const characters = JSON.parse(localStorage.getItem('ai-characters') || '[]');
    const scenes = JSON.parse(localStorage.getItem('ai-saved-scenes') || '[]');
    return { characters, scenes };
  } catch (e) {
    console.error("Error parsing local data", e);
    return { characters: [], scenes: [] };
  }
};

const saveLocalData = (data: AppData): void => {
  localStorage.setItem('ai-characters', JSON.stringify(data.characters));
  localStorage.setItem('ai-saved-scenes', JSON.stringify(data.scenes));
};

const clearLocalData = (): void => {
  localStorage.removeItem('ai-characters');
  localStorage.removeItem('ai-saved-scenes');
}

// --- Google Drive Implementation ---
// New, robust initialization logic
const initializeGoogleApis = async (): Promise<void> => {
    if (gapiInited && gisInited) {
        return;
    }

    if (!CLIENT_ID) {
        console.error("VITE_GOOGLE_CLIENT_ID is not configured. Google Drive integration is disabled.");
        throw new Error("Google Client ID is missing. Please add it to your environment file to use Google Drive sync.");
    }

    try {
        // Load Google API scripts dynamically and wait for them to be ready.
        await Promise.all([
            loadScript('https://apis.google.com/js/api.js'),
            loadScript('https://accounts.google.com/gsi/client'),
        ]);

        // Initialize GAPI client for Drive API
        await new Promise<void>((resolve, reject) => {
            window.gapi.load('client', {
                callback: resolve,
                onerror: reject,
                timeout: 5000, // 5 seconds
                ontimeout: () => reject(new Error('gapi.load("client") timed out.')),
            });
        });

        await window.gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;

        // Initialize GIS client for authentication
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: () => {}, // Callback is handled by the promise in signIn
        });
        gisInited = true;

    } catch (error) {
        console.error("Failed to initialize Google API clients:", error);
        gapiInited = false;
        gisInited = false;
        initPromise = null; // Allow retries
        throw new Error("Không thể kết nối đến dịch vụ của Google. Vui lòng kiểm tra lại kết nối mạng của bạn.");
    }
};


const findDataFile = async (): Promise<string | null> => {
    try {
        const response = await window.gapi.client.drive.files.list({
            q: `name='${DATA_FILE_NAME}' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });
        if (response.result.files && response.result.files.length > 0) {
            return response.result.files[0].id;
        }
        return null;
    } catch (e) {
        console.error("Error finding data file:", e);
        return null;
    }
};

const createDataFile = async (): Promise<string | null> => {
    try {
        const response = await window.gapi.client.drive.files.create({
            resource: {
                name: DATA_FILE_NAME,
                mimeType: 'application/json',
            },
            fields: 'id',
        });
        return response.result.id;
    } catch (e) {
        console.error("Error creating data file:", e);
        return null;
    }
}

const getDriveData = async (): Promise<AppData> => {
    const fileId = await findDataFile();
    if (!fileId) {
        return { characters: [], scenes: [] }; // No file, return empty data
    }

    try {
        const response = await window.gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return response.result as AppData;
    } catch (e: any) {
        // If file is empty or corrupt, it might fail.
        console.error("Error reading from drive file:", e);
        return { characters: [], scenes: [] };
    }
};

const saveDriveData = async (data: AppData): Promise<void> => {
    let fileId = await findDataFile();
    if (!fileId) {
        fileId = await createDataFile();
    }
    if (!fileId) {
        throw new Error("Could not create or find data file in Google Drive.");
    }
    
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;
    
    const metadata = {
        name: DATA_FILE_NAME,
        mimeType: 'application/json',
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data) +
        close_delim;
    
    await window.gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'multipart' },
        headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
    });
};

const clearDriveData = async (): Promise<void> => {
    await saveDriveData({ characters: [], scenes: [] });
};


// --- Public Service Interface ---
export const storageService = {
    initGoogleApis: (): Promise<void> => {
        if (!initPromise) {
            initPromise = initializeGoogleApis();
        }
        return initPromise;
    },

    signIn: (): Promise<any> => {
        return new Promise((resolve, reject) => {
            storageService.initGoogleApis().then(() => {
                if (!tokenClient) {
                   return reject(new Error("Google Auth client could not be initialized. Check console for details."));
                }
                tokenClient.callback = (resp: any) => {
                     if (resp.error !== undefined) {
                        return reject(resp);
                    }
                    // This is the crucial fix: ensure GAPI client has the token.
                    window.gapi.client.setToken(resp);
                    resolve(resp);
                };

                // Request token. This will trigger a popup if needed.
                tokenClient.requestAccessToken({ prompt: '' });

            }).catch(err => {
                console.error("Sign-in failed due to initialization error:", err);
                reject(err);
            });
        });
    },

    signOut: (): void => {
        if (gapiInited && gisInited && window.gapi?.client && window.google?.accounts) {
            const token = window.gapi.client.getToken();
            if (token !== null) {
                window.google.accounts.oauth2.revoke(token.access_token, () => {});
                window.gapi.client.setToken(null);
            }
        }
    },
    
    loadData: async (mode: 'local' | 'drive'): Promise<AppData> => {
        if (mode === 'drive') {
            await storageService.initGoogleApis();
            return await getDriveData();
        }
        return getLocalData();
    },

    saveData: async (mode: 'local' | 'drive', data: AppData): Promise<void> => {
        if (mode === 'drive') {
            await storageService.initGoogleApis();
            await saveDriveData(data);
        } else {
            saveLocalData(data);
        }
    },

    clearData: async (mode: 'local' | 'drive'): Promise<void> => {
        if (mode === 'drive') {
            await storageService.initGoogleApis();
            await clearDriveData();
        } else {
            clearLocalData();
        }
    }
};