'use client';

import React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchResults } from './search-results';
import { SearchFilters } from './search-filters';
import { useSearch } from '@/hooks/use-search';
import type { SearchQuery, SearchResult } from '@tbwa/shared';

export const SearchInterface = () => {
  const [query, setQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchQuery['filters']>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    results,
    isLoading,
    error,
    totalCount,
    search,
    clearResults
  } = useSearch();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    const searchQuery: SearchQuery = {
      query: query.trim(),
      filters,
      limit: 20,
      offset: 0,
    };
    
    await search(searchQuery);
  }, [query, filters, search]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    clearResults();
    searchInputRef.current?.focus();
  };

  const handleFilterChange = (newFilters: SearchQuery['filters']) => {
    setFilters(newFilters);
  };

  const handleFilterApply = () => {
    if (query.trim()) {
      handleSearch();
    }
    setIsFiltersOpen(false);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Focus search input on component mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Semantic Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search campaigns, files, or content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10"
                disabled={isLoading}
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Button
              type="button"
              onClick={handleSearch}
              disabled={!query.trim() || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.campaign_name && (
                <Badge variant="secondary" className="gap-1">
                  Campaign: {filters.campaign_name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, campaign_name: undefined }))}
                  />
                </Badge>
              )}
              {filters.client_name && (
                <Badge variant="secondary" className="gap-1">
                  Client: {filters.client_name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, client_name: undefined }))}
                  />
                </Badge>
              )}
              {filters.file_type && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.file_type}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, file_type: undefined }))}
                  />
                </Badge>
              )}
              {filters.mood_label && (
                <Badge variant="secondary" className="gap-1">
                  Mood: {filters.mood_label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, mood_label: undefined }))}
                  />
                </Badge>
              )}
              {filters.min_quality_score && (
                <Badge variant="secondary" className="gap-1">
                  Quality: {Math.round(filters.min_quality_score * 100)}%+
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setFilters(prev => ({ ...prev, min_quality_score: undefined }))}
                  />
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Search Filters Panel */}
          {isFiltersOpen && (
            <SearchFilters
              filters={filters}
              onChange={handleFilterChange}
              onApply={handleFilterApply}
              onClose={() => setIsFiltersOpen(false)}
            />
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">
              <p className="font-medium">Search Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {(results.length > 0 || isLoading) && (
        <SearchResults
          results={results}
          totalCount={totalCount}
          isLoading={isLoading}
          query={query}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && results.length === 0 && query && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Suggestions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check spelling and try different keywords</li>
                <li>Use broader terms (e.g., &quot;brand&quot; instead of &quot;branding strategy&quot;)</li>
                <li>Remove filters to expand your search</li>
                <li>Try searching for campaign names or client names</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {!isLoading && !error && results.length === 0 && !query && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Search Creative Campaigns</h3>
            <p className="text-muted-foreground mb-6">
              Use AI-powered semantic search to find campaigns, content, and insights
            </p>
            <div className="grid gap-4 md:grid-cols-3 text-left">
              <div className="space-y-2">
                <h4 className="font-medium">Search by Content</h4>
                <p className="text-sm text-muted-foreground">
                  Find campaigns containing specific themes, messages, or visual elements
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Filter by Attributes</h4>
                <p className="text-sm text-muted-foreground">
                  Narrow down results by client, file type, mood, or quality score
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Discover Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Explore semantic topics, mood classifications, and creative patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};