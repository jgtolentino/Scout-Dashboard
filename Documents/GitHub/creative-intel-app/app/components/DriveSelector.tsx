'use client';

import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { FolderIcon, FileIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

interface DriveSelectorProps {
  onSelect: (item: DriveItem) => void;
  onError: (error: string) => void;
  className?: string;
}

export const DriveSelector: React.FC<DriveSelectorProps> = ({
  onSelect,
  onError,
  className = ''
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveItem[]>([]);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      await fetchItems('root');
    },
    onError: () => onError('Failed to authenticate with Google Drive')
  });

  const fetchItems = async (folderId: string) => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed = false&fields=files(id,name,mimeType,parents)&orderBy=name`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      setItems(response.data.files);
      setCurrentFolder(folderId);

      if (folderId !== 'root') {
        const parentResponse = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,parents`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        updateBreadcrumbs(parentResponse.data);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      onError('Failed to fetch items from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const updateBreadcrumbs = async (item: DriveItem) => {
    const newBreadcrumbs: DriveItem[] = [item];
    let currentItem = item;

    while (currentItem.parents?.[0]) {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${currentItem.parents[0]}?fields=id,name,mimeType,parents`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        newBreadcrumbs.unshift(response.data);
        currentItem = response.data;
      } catch (error) {
        break;
      }
    }

    setBreadcrumbs(newBreadcrumbs);
  };

  const handleItemClick = async (item: DriveItem) => {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      await fetchItems(item.id);
    } else {
      onSelect(item);
    }
  };

  const handleBreadcrumbClick = async (item: DriveItem) => {
    await fetchItems(item.id);
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {!accessToken ? (
        <button
          onClick={() => login()}
          className="w-full p-4 text-center text-blue-600 hover:text-blue-800"
        >
          Connect to Google Drive
        </button>
      ) : (
        <>
          {/* Breadcrumbs */}
          <div className="flex items-center p-2 border-b">
            <button
              onClick={() => fetchItems('root')}
              className="text-gray-600 hover:text-gray-800"
            >
              My Drive
            </button>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.id}>
                <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick(item)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* File List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No items found</div>
            ) : (
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    {item.mimeType === 'application/vnd.google-apps.folder' ? (
                      <FolderIcon className="w-5 h-5 text-yellow-500 mr-2" />
                    ) : (
                      <FileIcon className="w-5 h-5 text-gray-500 mr-2" />
                    )}
                    <span className="text-sm">{item.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}; 