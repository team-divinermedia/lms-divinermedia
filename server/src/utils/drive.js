import { google } from 'googleapis';
import stream from 'stream';
import fs from 'fs';

let driveService = null;
let uploadFolderId = null;
let teamDocsFolderId = null;

const FOLDER_NAME = 'LMS_Uploads';
const TEAM_DOCS_FOLDER_NAME = 'Team Documents';

const initializeDriveService = async () => {
  if (driveService) return driveService;

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('Google Drive credentials missing in .env. Falling back to local storage is theoretically needed but Google Drive is main strategy. Uploads might fail.');
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  driveService = google.drive({ version: 'v3', auth: oauth2Client });

  // Initialize or find the root folder
  try {
    const res = await driveService.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      uploadFolderId = res.data.files[0].id;
    } else {
      const folderMetadata = {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const folderRes = await driveService.files.create({
        resource: folderMetadata,
        fields: 'id',
      });
      uploadFolderId = folderRes.data.id;
    }
  } catch (error) {
    console.error('Failed to initialize Google Drive folder:', error.message);
  }

  return driveService;
};

// Ensure "Team Documents" root folder exists; returns its Drive ID
const getTeamDocsFolder = async (drive) => {
  if (teamDocsFolderId) return teamDocsFolderId;

  const res = await drive.files.list({
    q: `name='${TEAM_DOCS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    teamDocsFolderId = res.data.files[0].id;
  } else {
    const folderRes = await drive.files.create({
      resource: { name: TEAM_DOCS_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    });
    teamDocsFolderId = folderRes.data.id;
  }

  return teamDocsFolderId;
};

// Create a "{name} Work" subfolder inside "Team Documents"; returns the folder ID
export const createLearnerFolder = async (learnerName) => {
  const drive = await initializeDriveService();
  if (!drive) throw new Error('Google Drive service is not initialized.');

  const parentId = await getTeamDocsFolder(drive);
  const folderName = `${learnerName} Work`;

  const folderRes = await drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  return folderRes.data.id;
};

export const uploadFileToDrive = async (filePath, originalName, mimeType, targetFolderId = null) => {
  const drive = await initializeDriveService();
  if (!drive || !uploadFolderId) {
    throw new Error('Google Drive service is not fully initialized. Check credentials.');
  }

  const folderId = targetFolderId || uploadFolderId;

  const fileMetadata = {
    name: originalName,
    parents: [folderId],
  };

  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath),
  };

  try {
    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    return res.data.id;
  } catch (error) {
    console.error('Error uploading file to Drive:', error.message);
    throw error;
  }
};

export const downloadFileStreamFromDrive = async (fileId, res) => {
  const drive = await initializeDriveService();
  if (!drive) {
    return res.status(500).json({ error: 'Drive service unavailable.' });
  }

  try {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    response.data
      .on('end', () => {})
      .on('error', (err) => {
        console.error('Error downloading file from Drive.', err);
        if (!res.headersSent) res.status(500).send('Error streaming file');
      })
      .pipe(res);
  } catch (error) {
    console.error('Error fetching file from Drive:', error.message);
    if (!res.headersSent) {
      res.status(404).json({ error: 'File not found or unreachable.' });
    }
  }
};
