import React, { useState, useEffect, useCallback } from 'react';
import { semanticSearch } from '../utils/aiApi';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const EnhancedSearch = ({
    onSearchResults,
    placeholder = "Search projects, features, or ideas...",
    className = "",
    showFilters = true,
    initialQuery = ""
}) => {
    const [query, setQuery] = useState(initialQuery);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        tags: [],
        sortBy: 'relevance'
    });
    const [searchHistory, setSearchHistory] = useState([]);
    const [suggestions, setSuggestions] = useState([]);

    // Load search history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('searchHistory');
        if (saved) {
            try {
                setSearchHistory(JSON.parse(saved));
            } catch (error) {

            }
        }
    }, []);

    // Save search history to localStorage
    const saveSearchHistory = useCallback((searchTerm) => {
        if (!searchTerm.trim()) return;

        setSearchHistory(prev => {
            const newHistory = [searchTerm, ...prev.filter(item => item !== searchTerm)].slice(0, 10);
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    // Generate search suggestions based on query
    const generateSuggestions = useCallback((searchTerm) => {
        if (!searchTerm.trim()) {
            setSuggestions([]);
            return;
        }

        // Generate semantic suggestions
        const semanticSuggestions = [
            `Find ${searchTerm} alternatives`,
            `Best ${searchTerm} tools`,
            `${searchTerm} for startups`,
            `${searchTerm} solutions`,
            `Top ${searchTerm} platforms`
        ];

        // Add history-based suggestions
        const historySuggestions = searchHistory
            .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 3);

        // Combine and deduplicate
        const allSuggestions = [...new Set([...semanticSuggestions, ...historySuggestions])];
        setSuggestions(allSuggestions.slice(0, 5));
    }, [searchHistory]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim().length >= 2) {
                generateSuggestions(query);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, generateSuggestions]);

    const performSearch = async (searchQuery = query) => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            toast.error('Please enter at least 2 characters to search');
            return;
        }

        setIsSearching(true);
        try {
            // Try AI search first
            const result = await semanticSearch(searchQuery, 20, filters);

            if (result && result.success) {
                const results = result.results || [];
                setSearchResults(results);
                saveSearchHistory(searchQuery);

                // Track search query
                trackSearch(searchQuery, results.length);

                if (onSearchResults) {
                    onSearchResults(results, searchQuery);
                }

                if (results.length === 0) {
                    toast.info('No results found. Try different keywords or filters.');
                } else {
                    toast.success(`Found ${results.length} results for "${searchQuery}"`);
                }
            } else {
                // Fallback to basic search if AI search fails

                await performFallbackSearch(searchQuery);
            }
        } catch (error) {


            // Try fallback search if AI search throws an error
            try {
                await performFallbackSearch(searchQuery);
            } catch (fallbackError) {


                // Provide user-friendly error message
                let errorMessage = 'Search failed. Please try again.';

                if (error.message) {
                    if (error.message.includes('fetch')) {
                        errorMessage = 'Network error. Please check your connection.';
                    } else if (error.message.includes('HTTP')) {
                        errorMessage = 'Service temporarily unavailable. Please try again later.';
                    }
                }

                toast.error(errorMessage);

                // Set empty results and notify parent component
                setSearchResults([]);
                if (onSearchResults) {
                    onSearchResults([], searchQuery);
                }
            }
        } finally {
            setIsSearching(false);
        }
    };

    // Fallback search using Supabase directly
    const performFallbackSearch = async (searchQuery) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tagline.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
                .limit(20);

            if (error) {
                throw error;
            }

            const results = data || [];
            setSearchResults(results);
            saveSearchHistory(searchQuery);

            // Track search query (fallback)
            trackSearch(searchQuery, results.length);

            if (onSearchResults) {
                onSearchResults(results, searchQuery);
            }

            if (results.length === 0) {
                toast.info('No results found. Try different keywords or filters.');
            } else {
                toast.success(`Found ${results.length} results for "${searchQuery}" (using fallback search)`);
            }
        } catch (error) {

            throw error;
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch();
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        performSearch(suggestion);
    };

    const handleHistoryClick = (historyItem) => {
        setQuery(historyItem);
        performSearch(historyItem);
    };

    const clearSearch = () => {
        setQuery('');
        setSearchResults([]);
        setSuggestions([]);
        if (onSearchResults) {
            onSearchResults([], '');
        }
    };

    const updateFilter = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            tags: [],
            sortBy: 'relevance'
        });
    };

    const hasActiveFilters = filters.category || filters.tags.length > 0 || filters.sortBy !== 'relevance';

    return (
        <div className={`enhanced-search ${className}`}>
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            try {
                                setQuery(e.target.value);
                            } catch (error) {

                                toast.error('Search input error. Please try again.');
                            }
                        }}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSearching}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        {query && (
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        clearSearch();
                                    } catch (error) {

                                        toast.error('Error clearing search. Please try again.');
                                    }
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                        {showFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        setShowFiltersPanel(!showFiltersPanel);
                                    } catch (error) {

                                        toast.error('Error with filters. Please try again.');
                                    }
                                }}
                                className={`p-1 rounded transition-colors ${hasActiveFilters
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <Filter className="h-5 w-5" />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSearching ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Search Suggestions */}
            {suggestions.length > 0 && query.trim().length >= 2 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                    <div className="text-sm text-gray-500 mb-2 px-2">Suggestions:</div>
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-2 py-2 text-md text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && !query && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                    <div className="text-sm text-gray-500 mb-2 px-2">Recent searches:</div>
                    {searchHistory.slice(0, 5).map((historyItem, index) => (
                        <button
                            key={index}
                            onClick={() => handleHistoryClick(historyItem)}
                            className="w-full text-left px-2 py-2 text-md text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                            {historyItem}
                        </button>
                    ))}
                </div>
            )}

            {/* Filters Panel */}
            {showFilters && showFiltersPanel && (
                <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-medium text-gray-900">Search Filters</h3>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-md text-blue-600 hover:text-blue-800"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-md font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={filters.category}
                                onChange={(e) => updateFilter('category', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Categories</option>
                                <option value="saas">SaaS</option>
                                <option value="ai">AI & ML</option>
                                <option value="fintech">Fintech</option>
                                <option value="ecommerce">E-commerce</option>
                                <option value="healthtech">Health Tech</option>
                                <option value="edtech">Ed Tech</option>
                                <option value="productivity">Productivity</option>
                                <option value="social">Social</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Sort By Filter */}
                        <div>
                            <label className="block text-md font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => updateFilter('sortBy', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="relevance">Relevance</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="popular">Most Popular</option>
                                <option value="trending">Trending</option>
                            </select>
                        </div>

                        {/* Apply Filters Button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => performSearch()}
                                disabled={isSearching}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Results Summary */}
            {searchResults.length > 0 && (
                <div className="mt-4 text-md text-gray-600">
                    Found {searchResults.length} results for "{query}"
                    {hasActiveFilters && (
                        <span className="ml-2 text-blue-600">
                            (with filters applied)
                        </span>
                    )}
                </div>
            )}

            {/* AI Search Info */}
            <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                <span className="text-blue-600">🤖</span>
                <span>Powered by AI semantic search - finds related content by meaning</span>
            </div>
        </div>
    );
};

export default EnhancedSearch; 