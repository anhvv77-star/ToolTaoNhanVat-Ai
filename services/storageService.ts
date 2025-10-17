import type { Character, Scene } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = 'YOUR_GOOGLE_API_KEY_FOR_GAPI'; // Note: This is different from Gemini Key
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DATA_FILE_NAME = 'ai-character-data.json';

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

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

/**
 * Initializes the GAPI client.
 */
const gapiInit = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        window.gapi.load('client', async () => {
            try {
                await window.gapi.client.init({
                    // apiKey: API_KEY, // API Key is not needed for OAuth2
                    discoveryDocs: [DISCOVERY_DOC],
                });
                gapiInited = true;
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
};

/**
 * Initializes the GIS client.
 */
const gisInit = (): Promise<void> => {
    return new Promise((resolve) => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: () => {}, // Callback is handled by the promise
        });
        gisInited = true;
        resolve();
    });
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
    initGoogleApis: async (): Promise<void> => {
        await gapiInit();
        await gisInit();
    },

    signIn: (): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!tokenClient) {
                return reject("Google Auth not initialized.");
            }
            tokenClient.callback = (resp: any) => {
                 if (resp.error !== undefined) {
                    return reject(resp);
                }
                resolve(resp);
            };
            tokenClient.requestAccessToken({ prompt: '' });
        });
    },

    signOut: (): void => {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token, () => {});
            window.gapi.client.setToken(null);
        }
    },
    
    loadData: async (mode: 'local' | 'drive'): Promise<AppData> => {
        if (mode === 'drive') {
            return await getDriveData();
        }
        return getLocalData();
    },

    saveData: async (mode: 'local' | 'drive', data: AppData): Promise<void> => {
        if (mode === 'drive') {
            await saveDriveData(data);
        } else {
            saveLocalData(data);
        }
    },

    clearData: async (mode: 'local' | 'drive'): Promise<void> => {
        if (mode === 'drive') {
            await clearDriveData();
        } else {
            clearLocalData();
        }
    }
};
