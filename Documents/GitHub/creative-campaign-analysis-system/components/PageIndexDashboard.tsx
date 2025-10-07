'use client';

import React, { useState, useEffect } from 'react';
import { Search, FileText, Tag, BarChart3, Upload, Eye, Brain, Hash } from 'lucide-react';

interface ChunkResult {
  chunk_id: string;
  file_id: string;
  filename: string;
  campaign_name: string;
  title: string;
  snippet: string;
  quality_score: number;
  mood: string;
  confidence: number;
  tags?: string[];
}

interface ProcessingStats {
  files_processed: number;
  chunks_created: number;
  errors: number;
}

export function PageIndexDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChunkResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState<ProcessingStats>({ files_processed: 0, chunks_created: 0, errors: 0 });
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const moodFilters = [
    'all', 'celebratory', 'corporate', 'intimate', 'energetic', 
    'sophisticated', 'playful', 'dramatic', 'minimalist'
  ];

  useEffect(() => {
    // Load initial stats
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/pageindex?action=stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/pageindex?action=search&query=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // In a real implementation, you would upload the file first
      // For demo, we'll simulate processing
      const response = await fetch('/api/pageindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process-file',
          filepath: `uploads/${file.name}`,
          campaignName: 'Demo Campaign',
          clientName: 'Demo Client'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('File processed:', data);
        await fetchStats(); // Refresh stats
      } else {
        console.error('File processing failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filterResultsByMood = (results: ChunkResult[]) => {
    if (selectedFilter === 'all') return results;
    return results.filter(result => result.mood === selectedFilter);
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMoodColor = (mood: string) => {
    const colors = {
      celebratory: 'bg-pink-100 text-pink-800',
      corporate: 'bg-blue-100 text-blue-800',
      intimate: 'bg-purple-100 text-purple-800',
      energetic: 'bg-orange-100 text-orange-800',
      sophisticated: 'bg-gray-100 text-gray-800',
      playful: 'bg-green-100 text-green-800',
      dramatic: 'bg-red-100 text-red-800',
      minimalist: 'bg-slate-100 text-slate-800'
    };
    return colors[mood] || 'bg-gray-100 text-gray-800';
  };

  const filteredResults = filterResultsByMood(searchResults);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Files Processed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.files_processed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <Hash className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chunks Created</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.chunks_created}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing Errors</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.errors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Process New Content</h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center px-4 py-2 bg-black text-white rounded hover:bg-gray-800 cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Upload File'}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.webm"
              disabled={isProcessing}
            />
          </label>
          <p className="text-sm text-gray-600">
            Supports documents, images, presentations, and videos
          </p>
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Semantic Search</h3>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for creative concepts, moods, campaigns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length > 2) {
                  const debounceTimeout = setTimeout(() => {
                    handleSearch(e.target.value);
                  }, 500);
                  return () => clearTimeout(debounceTimeout);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
            />
          </div>

          {/* Mood Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Filter by mood:</span>
            {moodFilters.map(mood => (
              <button
                key={mood}
                onClick={() => setSelectedFilter(mood)}
                className={`px-3 py-1 text-xs rounded-full border ${
                  selectedFilter === mood
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Search Results
              {filteredResults.length > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  ({filteredResults.length} results)
                </span>
              )}
            </h3>
          </div>

          <div className="divide-y">
            {isSearching ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Searching...</p>
              </div>
            ) : filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <div key={result.chunk_id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getMoodColor(result.mood)}`}>
                          {result.mood}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {result.snippet}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <FileText className="mr-1 h-3 w-3" />
                          {result.filename}
                        </span>
                        {result.campaign_name && (
                          <span className="flex items-center">
                            <Tag className="mr-1 h-3 w-3" />
                            {result.campaign_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1 ml-4">
                      <div className={`px-2 py-1 text-xs rounded ${getQualityColor(result.quality_score)}`}>
                        Quality: {(result.quality_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Confidence: {(result.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  {result.tags && result.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {result.tags.slice(0, 5).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : searchQuery.length > 2 ? (
              <div className="p-6 text-center">
                <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-sm text-gray-600">
                  Try different keywords or check if the content has been processed yet.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleSearch('high quality')}
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <Eye className="h-5 w-5 text-green-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">High Quality Content</p>
              <p className="text-xs text-gray-600">Find top-performing creative</p>
            </div>
          </button>

          <button
            onClick={() => handleSearch('emotional impact')}
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <Brain className="h-5 w-5 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Emotional Content</p>
              <p className="text-xs text-gray-600">Explore emotional appeal</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedFilter('celebratory')}
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <Tag className="h-5 w-5 text-pink-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Celebratory Mood</p>
              <p className="text-xs text-gray-600">Filter by mood type</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}