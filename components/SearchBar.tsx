"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchResult {
  id: number;
  title: string;
  summary: string;
  category: string;
  slug: string;
  image: string;
}

interface SearchBarProps {
  onSearch: (results: SearchResult[]) => void;
  onSelect: (slug: string) => void;
  newsItems: SearchResult[];
}

export function SearchBar({ onSearch, onSelect, newsItems }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug log for initial props
  useEffect(() => {
    console.log('🔍 SearchBar mounted with newsItems:', newsItems.length);
  }, [newsItems]);

  // Reset results when dialog opens
  useEffect(() => {
    if (open) {
      console.log('🔍 Resetting search state');
      setResults([]);
      setQuery('');
      setIsSearching(false);
    }
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const performSearch = useCallback((value: string) => {
    console.log('🔍 Performing search with value:', value);
    
    if (!value.trim()) {
      console.log('🔍 Empty search, clearing results');
      setResults([]);
      onSearch([]);
      return;
    }

    const searchTerms = value.toLowerCase().split(' ');
    console.log('🔍 Search terms:', searchTerms);
    
    const filteredResults = newsItems.filter(item => {
      // Create a searchable text that includes title, category, and summary
      const searchableText = `
        ${item.title.toLowerCase()} 
        ${item.category.toLowerCase()}
        ${item.summary.toLowerCase()}
      `;
      
      // Check if all search terms are present in the searchable text
      const matches = searchTerms.every(term => searchableText.includes(term));
      
      // Only log matches that are actually relevant
      if (matches) {
        console.log('🔍 Found match:', item.title);
      }
      return matches;
    });

    console.log('🔍 Filtered results count:', filteredResults.length);

    // Sort results by relevance
    const sortedResults = filteredResults.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aCategory = a.category.toLowerCase();
      const bCategory = b.category.toLowerCase();
      const aSummary = a.summary.toLowerCase();
      const bSummary = b.summary.toLowerCase();
      
      // Exact title match gets highest priority
      const aExactTitleMatch = aTitle === value.toLowerCase();
      const bExactTitleMatch = bTitle === value.toLowerCase();
      if (aExactTitleMatch && !bExactTitleMatch) return -1;
      if (!aExactTitleMatch && bExactTitleMatch) return 1;
      
      // Category match gets second priority
      const aCategoryMatch = aCategory === value.toLowerCase();
      const bCategoryMatch = bCategory === value.toLowerCase();
      if (aCategoryMatch && !bCategoryMatch) return -1;
      if (!aCategoryMatch && bCategoryMatch) return 1;
      
      // Title starts with search term gets third priority
      const aStartsWith = aTitle.startsWith(value.toLowerCase());
      const bStartsWith = bTitle.startsWith(value.toLowerCase());
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Summary contains search term gets fourth priority
      const aSummaryMatch = aSummary.includes(value.toLowerCase());
      const bSummaryMatch = bSummary.includes(value.toLowerCase());
      if (aSummaryMatch && !bSummaryMatch) return -1;
      if (!aSummaryMatch && bSummaryMatch) return 1;
      
      return 0;
    });

    console.log('🔍 Setting results:', sortedResults.length);
    setResults(sortedResults);
    console.log('🔍 UI: Search results updated:', sortedResults.map(r => r.title));
    onSearch(sortedResults);
  }, [newsItems, onSearch]);

  const handleSearch = useCallback((value: string) => {
    console.log('🔍 Search input changed:', value);
    setQuery(value);
    setIsSearching(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch(value);
      setIsSearching(false);
      console.log('🔍 Search completed, isSearching set to false');
    }, 300);
  }, [performSearch]);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search news...</span>
        <span className="sr-only">Search news</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search news..." 
          value={query}
          onValueChange={handleSearch}
          autoFocus
        />
        <CommandList className="max-h-[80vh] overflow-y-auto">
          {isSearching ? (
            <CommandEmpty>Searching...</CommandEmpty>
          ) : results.length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <>
              <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                Use ↑↓ arrow keys to navigate, Enter to select
              </div>
              <CommandGroup heading={`Results (${results.length})`} className="overflow-y-auto">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.summary} ${result.category}`}
                    onSelect={() => {
                      console.log('🔍 Selected result:', {
                        title: result.title,
                        slug: result.slug,
                        id: result.id
                      });
                      const event = new CustomEvent('openNewsCard', {
                        detail: {
                          id: result.id,
                          slug: result.slug,
                          title: result.title
                        }
                      });
                      console.log('🔍 Dispatching openNewsCard event:', event.detail);
                      document.dispatchEvent(event);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <img 
                        src={result.image} 
                        alt={result.title}
                        className="h-8 w-8 rounded object-cover"
                      />
                      <div className="flex flex-col flex-1">
                        <p className="font-medium">{result.title}</p>
                        <p className="text-sm text-muted-foreground">{result.category}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{result.summary}</p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
} 