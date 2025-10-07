'use client';

import { useState, useEffect } from 'react';
import { ApiVersion, API_VERSIONS, DEFAULT_VERSION } from '@/lib/api/versioning';
import { apiV1, apiV2, apiLegacy } from '@/lib/api/client';

interface ApiVersionSelectorProps {
  onVersionChange?: (version: ApiVersion) => void;
  className?: string;
}

export function ApiVersionSelector({ onVersionChange, className = '' }: ApiVersionSelectorProps) {
  const [currentVersion, setCurrentVersion] = useState<ApiVersion>(DEFAULT_VERSION);
  const [versionInfo, setVersionInfo] = useState<any>(null);

  useEffect(() => {
    // Fetch version information
    fetch('/api/versions')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(console.error);
  }, []);

  const handleVersionChange = (version: ApiVersion) => {
    setCurrentVersion(version);
    
    // Update global API client
    switch (version) {
      case 'v1':
        window.apiClient = apiV1;
        break;
      case 'v2':
        window.apiClient = apiV2;
        break;
      case 'legacy':
        window.apiClient = apiLegacy;
        break;
    }
    
    onVersionChange?.(version);
  };

  const versionConfig = API_VERSIONS[currentVersion];

  return (
    <div className={`api-version-selector ${className}`}>
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <label htmlFor="api-version" className="text-sm font-medium text-gray-700">
          API Version:
        </label>
        <select
          id="api-version"
          value={currentVersion}
          onChange={(e) => handleVersionChange(e.target.value as ApiVersion)}
          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(API_VERSIONS).map(([version, config]) => (
            <option key={version} value={version} disabled={!config.supported}>
              {version} {version === versionInfo?.latest && '(Latest)'}
              {version === versionInfo?.default && '(Default)'}
              {config.deprecated && '(Deprecated)'}
            </option>
          ))}
        </select>
        
        {versionConfig.deprecated && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Deprecated - Sunset: {versionConfig.sunset}</span>
          </div>
        )}
        
        <div className="ml-auto text-sm text-gray-500">
          Features: {versionConfig.features.join(', ')}
        </div>
      </div>
      
      {versionInfo && (
        <div className="mt-2 text-xs text-gray-500">
          Rate Limit: {currentVersion === 'v2' ? '200' : currentVersion === 'v1' ? '100' : '50'} requests / 15 min
        </div>
      )}
    </div>
  );
}

// Global type declaration
declare global {
  interface Window {
    apiClient: any;
  }
}