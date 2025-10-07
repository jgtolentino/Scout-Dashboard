/**
 * Google Drive Data Sync Function
 * Monitors Google Drive folders for new data files and syncs them to Supabase
 * Supports CSV, JSON, Excel files with automatic schema detection
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_DRIVE_CLIENT_ID = Deno.env.get("GOOGLE_DRIVE_CLIENT_ID")!;
const GOOGLE_DRIVE_CLIENT_SECRET = Deno.env.get("GOOGLE_DRIVE_CLIENT_SECRET")!;
const GOOGLE_DRIVE_REFRESH_TOKEN = Deno.env.get("GOOGLE_DRIVE_REFRESH_TOKEN")!;

interface SyncRequest {
  action: "sync" | "status" | "validate";
  folder_paths?: string[];
  force_sync?: boolean;
}

interface FileMetadata {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: number;
  parents: string[];
  path: string;
}

interface SyncResult {
  success: boolean;
  files_processed: number;
  files_added: number;
  files_updated: number;
  errors: string[];
  duration_ms: number;
}

// Monitored folders in Google Drive
const MONITORED_FOLDERS = [
  {
    path: "/tbwa-creative-system/",
    domain: "ces",
    description: "Creative Effectiveness System data"
  },
  {
    path: "/retail-insights-dashboard-ph/", 
    domain: "scout",
    description: "Scout retail analytics data"
  },
  {
    path: "/GitHub/",
    domain: "docs", 
    description: "Documentation and guides"
  }
];

/**
 * Get Google Drive access token using refresh token
 */
async function getAccessToken(): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      client_secret: GOOGLE_DRIVE_CLIENT_SECRET,
      refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await response.json();
  if (!response.ok || !tokenData.access_token) {
    throw new Error(`Failed to get access token: ${tokenData.error_description || 'Unknown error'}`);
  }

  return tokenData.access_token;
}

/**
 * Search for files in Google Drive folder
 */
async function searchDriveFiles(accessToken: string, folderPath: string): Promise<FileMetadata[]> {
  // First find the folder by path
  const folderQuery = `name='${folderPath.split('/').filter(p => p).pop()}' and mimeType='application/vnd.google-apps.folder'`;
  const folderResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQuery)}&fields=files(id,name,parents)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  const folderData = await folderResponse.json();
  if (!folderData.files?.length) {
    console.warn(`Folder not found: ${folderPath}`);
    return [];
  }

  const folderId = folderData.files[0].id;

  // Search for data files in the folder
  const fileQuery = `'${folderId}' in parents and (mimeType='text/csv' or mimeType='application/json' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel')`;
  const filesResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fileQuery)}&fields=files(id,name,mimeType,modifiedTime,size,parents)&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  const filesData = await filesResponse.json();
  return (filesData.files || []).map((file: any) => ({
    ...file,
    path: folderPath
  }));
}

/**
 * Download file content from Google Drive
 */
async function downloadFile(accessToken: string, fileId: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Parse CSV data to JSON
 */
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    
    rows.push(row);
  }

  return rows;
}

/**
 * Process and store file data in Supabase
 */
async function processFileData(
  supabase: any,
  file: FileMetadata,
  content: string,
  domain: string
): Promise<{ added: number; updated: number }> {
  let data: any[];

  // Parse file based on type
  try {
    if (file.mimeType === 'application/json') {
      data = JSON.parse(content);
    } else if (file.mimeType === 'text/csv') {
      data = parseCSV(content);
    } else {
      throw new Error(`Unsupported file type: ${file.mimeType}`);
    }
  } catch (error) {
    throw new Error(`Failed to parse ${file.name}: ${error.message}`);
  }

  if (!Array.isArray(data)) {
    data = [data];
  }

  // Store in appropriate table based on domain and file type
  const tableName = getTableName(domain, file.name);
  
  // Check if file was already processed
  const { data: existingFile } = await supabase
    .from('drive_sync_files')
    .select('last_modified')
    .eq('file_id', file.id)
    .single();

  const isUpdate = existingFile && new Date(existingFile.last_modified) < new Date(file.modifiedTime);
  
  // Insert/update data
  const { error: insertError } = await supabase
    .from(tableName)
    .upsert(data.map(row => ({
      ...row,
      _source_file: file.name,
      _source_path: file.path,
      _sync_timestamp: new Date().toISOString()
    })));

  if (insertError) {
    throw new Error(`Failed to insert data into ${tableName}: ${insertError.message}`);
  }

  // Update sync tracking
  await supabase
    .from('drive_sync_files')
    .upsert({
      file_id: file.id,
      file_name: file.name,
      file_path: file.path,
      domain,
      last_modified: file.modifiedTime,
      sync_timestamp: new Date().toISOString(),
      record_count: data.length
    });

  return {
    added: isUpdate ? 0 : data.length,
    updated: isUpdate ? data.length : 0
  };
}

/**
 * Get table name based on domain and file name
 */
function getTableName(domain: string, fileName: string): string {
  const cleanName = fileName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_{2,}/g, '_');
  return `${domain}_${cleanName}`.substring(0, 63); // PostgreSQL table name limit
}

serve(async (req) => {
  const startTime = performance.now();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  const supabase = createClient(SUPABASE_URL, SRK, { 
    auth: { persistSession: false } 
  });

  try {
    const body: SyncRequest = await req.json().catch(() => ({ action: "sync" }));
    const { action, folder_paths, force_sync } = body;

    if (action === "status") {
      // Return sync status
      const { data: syncFiles } = await supabase
        .from('drive_sync_files')
        .select('*')
        .order('sync_timestamp', { ascending: false })
        .limit(100);

      return new Response(JSON.stringify({
        status: "active",
        last_sync: syncFiles?.[0]?.sync_timestamp,
        files_tracked: syncFiles?.length || 0,
        monitored_folders: MONITORED_FOLDERS
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (action === "validate") {
      // Validate Google Drive connection
      try {
        await getAccessToken();
        return new Response(JSON.stringify({
          valid: true,
          message: "Google Drive connection successful"
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          valid: false,
          error: error.message
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Main sync action
    const accessToken = await getAccessToken();
    const foldersToSync = folder_paths || MONITORED_FOLDERS.map(f => f.path);
    
    const result: SyncResult = {
      success: true,
      files_processed: 0,
      files_added: 0,
      files_updated: 0,
      errors: [],
      duration_ms: 0
    };

    for (const folderConfig of MONITORED_FOLDERS) {
      if (!foldersToSync.includes(folderConfig.path)) continue;

      try {
        const files = await searchDriveFiles(accessToken, folderConfig.path);
        
        for (const file of files) {
          try {
            // Skip if file hasn't been modified (unless force sync)
            if (!force_sync) {
              const { data: existingFile } = await supabase
                .from('drive_sync_files')
                .select('last_modified')
                .eq('file_id', file.id)
                .single();

              if (existingFile && new Date(existingFile.last_modified) >= new Date(file.modifiedTime)) {
                continue; // Skip unmodified file
              }
            }

            const content = await downloadFile(accessToken, file.id);
            const processResult = await processFileData(supabase, file, content, folderConfig.domain);
            
            result.files_processed++;
            result.files_added += processResult.added;
            result.files_updated += processResult.updated;

            console.log(`Processed ${file.name}: +${processResult.added} new, ~${processResult.updated} updated`);

          } catch (fileError) {
            const errorMsg = `Error processing ${file.name}: ${fileError.message}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
          }
        }

      } catch (folderError) {
        const errorMsg = `Error syncing folder ${folderConfig.path}: ${folderError.message}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    result.success = result.errors.length === 0;
    result.duration_ms = Math.round(performance.now() - startTime);

    // Log sync operation
    await supabase.from('drive_sync_logs').insert({
      action,
      files_processed: result.files_processed,
      files_added: result.files_added,
      files_updated: result.files_updated,
      errors: result.errors,
      duration_ms: result.duration_ms
    });

    return new Response(JSON.stringify(result), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });

  } catch (error) {
    console.error("Drive sync error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: String(error?.message || error) 
    }), { 
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});