import React, { useState } from 'react';
import './../styles/SearchBar.css';
import { Button } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import FilterDropdown, { type FilterOptions } from './FilterDropdown';
import { IconCalendar, IconMapPin, IconUsers } from '@tabler/icons-react';

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
    console.log('Search submitted:', { query, filters });
    onSearch(query, { ...filters }); // Ensure we're passing a new object reference
  };

  const handleFilterChange = (updatedFilters: FilterOptions) => {
    console.log(' Filters updated in SearchBar:', updatedFilters);
    setFilters(updatedFilters);
    // Trigger search immediately when location filters change
    if (updatedFilters.nearMe) {
      console.log(' Location filter changed, triggering search...');
      onSearch(query, { ...updatedFilters });
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-container">
        <IconSearch size={16} className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Search for cafes..."
          className="search-input"
          aria-label="Search"
        />
      </div>
      
      <div className="location-filter">
        <span className="search-label">Location</span>
        <div className="search-value">
          <IconMapPin size={14} style={{ marginRight: '4px' }} />
          {filters.location || 'Where are you going?'}
        </div>
      </div>
      
      <div className="check-in">
        <span className="search-label">Check in</span>
        <div className="search-value">
          <IconCalendar size={14} style={{ marginRight: '4px' }} />
          Add dates
        </div>
      </div>
      
      <div className="guests">
        <span className="search-label">Guests</span>
        <div className="search-value">
          <IconUsers size={14} style={{ marginRight: '4px' }} />
          Add guests
        </div>
      </div>
      
      <div className="filter-dropdown-container">
        <FilterDropdown onFilterChange={handleFilterChange} />
      </div>
      
      <button type="submit" className="search-button">
        <IconSearch size={16} />
      </button>
    </form>
  );
}
