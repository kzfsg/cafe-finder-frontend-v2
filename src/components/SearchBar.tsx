import React, { useState } from 'react';
import './../App.css';
import { Button } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import FilterDropdown, { type FilterOptions } from './FilterDropdown';

interface SearchBarProps {
  onSearch: (query: string, filters?: FilterOptions) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    location: '',
    wifi: false,
    powerOutlet: false,
    seatingCapacity: null,
    noiseLevel: null,
    priceRange: null,
    upvotes: null,
    downvotes: null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, filters);
  };

  const handleFilterChange = (updatedFilters: FilterOptions) => {
    setFilters(updatedFilters);
    // Optionally trigger search immediately when filters change
    // onSearch(query, updatedFilters);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div className="search-input-container" style={{ flex: 1, position: 'relative' }}>
        <IconSearch size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
        <input
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Search for cafes..."
          className="search-input"
          aria-label="Search"
          style={{ paddingLeft: '32px' }}
        />
      </div>
      
      <FilterDropdown onFilterChange={handleFilterChange} />
      
      <Button type="submit" style={{ borderRadius: '4px', height: '36px' }}>
        Search
      </Button>
    </form>
  );
}
