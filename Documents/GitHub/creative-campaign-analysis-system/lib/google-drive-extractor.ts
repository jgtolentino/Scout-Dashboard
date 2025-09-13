// Google Drive Extractor for TBWA Creative Campaign Files
import { google } from 'googleapis';
import { CampaignDocument } from './types';

export class GoogleDriveExtractor {
  private drive: any;
  private docs: any;
  private sheets: any;

  constructor() {
    // Initialize Google APIs
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/documents.readonly',
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.docs = google.docs({ version: 'v1', auth });
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async extractDocuments(folderId?: string): Promise<CampaignDocument[]> {
    try {
      const query = folderId ? `'${folderId}' in parents` : undefined;
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents)',
        pageSize: 1000
      });

      const files = response.data.files || [];
      
      return files.map((file: any) => ({
        id: file.id,
        filename: file.name,
        mimeType: file.mimeType,
        size: parseInt(file.size) || 0,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        driveId: file.id,
        path: this.constructPath(file),
        fileType: this.classifyFileType(file)
      }));
    } catch (error) {
      console.error('Error extracting documents from Google Drive:', error);
      throw error;
    }
  }

  async extractFeatures(document: CampaignDocument): Promise<any> {
    try {
      let textContent = '';
      
      if (document.mimeType.includes('document')) {
        textContent = await this.extractDocumentText(document.id);
      } else if (document.mimeType.includes('presentation')) {
        textContent = await this.extractPresentationText(document.id);
      } else if (document.mimeType.includes('spreadsheet')) {
        textContent = await this.extractSpreadsheetText(document.id);
      } else {
        // For other file types, use filename and metadata
        textContent = `${document.filename} ${document.mimeType}`;
      }

      return {
        textContent,
        metadata: {
          fileType: document.fileType,
          size: document.size,
          mimeType: document.mimeType
        }
      };
    } catch (error) {
      console.error(`Error extracting features from ${document.filename}:`, error);
      return {
        textContent: document.filename,
        metadata: {
          fileType: document.fileType,
          size: document.size,
          mimeType: document.mimeType
        }
      };
    }
  }

  private async extractDocumentText(documentId: string): Promise<string> {
    try {
      const response = await this.docs.documents.get({
        documentId
      });

      const content = response.data.body?.content || [];
      let text = '';
      
      for (const element of content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun) {
              text += textElement.textRun.content;
            }
          }
        }
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting document text:', error);
      return '';
    }
  }

  private async extractPresentationText(presentationId: string): Promise<string> {
    try {
      // For presentations, we'll extract slide titles and text
      // This is a simplified version - you might want to use Google Slides API
      return `Presentation: ${presentationId}`;
    } catch (error) {
      console.error('Error extracting presentation text:', error);
      return '';
    }
  }

  private async extractSpreadsheetText(spreadsheetId: string): Promise<string> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        ranges: ['A1:Z100'] // Adjust range as needed
      });

      let text = '';
      const sheets = response.data.sheets || [];
      
      for (const sheet of sheets) {
        const values = sheet.data?.[0]?.values || [];
        for (const row of values) {
          text += row.join(' ') + '\n';
        }
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting spreadsheet text:', error);
      return '';
    }
  }

  private constructPath(file: any): string {
    // Simple path construction - in a real implementation,
    // you might want to traverse the folder hierarchy
    return file.parents ? file.parents[0] : 'root';
  }

  private classifyFileType(file: any): 'video' | 'image' | 'presentation' | 'document' | 'other' {
    const mimeType = file.mimeType.toLowerCase();
    
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('presentation')) return 'presentation';
    if (mimeType.includes('document')) return 'document';
    
    return 'other';
  }
}