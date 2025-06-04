import React, { useState } from 'react';
import './../styles/SearchBar.css';
import { IconSearch, IconFilter, IconThumbUp, IconMapPin } from '@tabler/icons-react';
import { Popover, Stack, Text, Loader, SegmentedControl, TextInput, Select, Checkbox } from '@mantine/core';
import { getCurrentLocation } from '../utils/geolocation';

export interface FilterOptions {
  location?: string;
  wifi?: boolean;
  powerOutlet?: boolean;
  seatingCapacity?: number | null;
  noiseLevel?: string | null;
  priceRange?: string | null;
  upvotes?: number | null;
  downvotes?: number | null;
  nearMe?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  } | null;
}

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
    downvotes: null,
    nearMe: null
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, { ...filters });
  };

  const handleFilterChange = (updatedFilters: FilterOptions) => {
    setFilters(updatedFilters);
    onSearch(query, updatedFilters);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      const position = await getCurrentLocation();
      const updatedFilters = { 
        ...filters, 
        location: '',
        nearMe: {
          latitude: position.latitude,
          longitude: position.longitude,
          radiusKm: 1
        }
      };
      
      setFilters(updatedFilters);
      onSearch(query, updatedFilters);
    } catch (error) {
      console.error('Error getting location:', error);
      // Reset nearMe on error
      const updatedFilters = { ...filters, nearMe: null };
      setFilters(updatedFilters);
    } finally {
      setIsLoadingLocation(false);
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
      
      <Popover opened={activeFilter === 'location'} onChange={(o) => setActiveFilter(o ? 'location' : null)}>
        <Popover.Target>
          <div className="location-filter" onClick={() => setActiveFilter('location')}>
            <span className="search-label">Location</span>
            <div className="search-value">
              <IconMapPin size={14} style={{ marginRight: '4px' }} />
              {filters.nearMe ? 'Near Me' : filters.location || 'Where are you going?'}
            </div>
          </div>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs" p="sm" style={{ width: 300 }}>
            <SegmentedControl
              data={[
                { label: 'By Name', value: 'name' },
                { label: 'Near Me', value: 'nearMe' }
              ]}
              value={filters.nearMe ? 'nearMe' : 'name'}
              onChange={(value) => {
                if (value === 'name') {
                  handleFilterChange({ ...filters, nearMe: null });
                } else {
                  handleGetCurrentLocation();
                }
              }}
              disabled={isLoadingLocation}
              fullWidth
            />
            {isLoadingLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Loader size="xs" />
                <Text size="sm">Getting your location...</Text>
              </div>
            )}
            {!filters.nearMe && (
              <TextInput
                placeholder="Enter location name"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange({ ...filters, location: e.target.value })}
                leftSection={<IconMapPin size={16} />}
              />
            )}
            {filters.nearMe && (
              <Select
                label="Search Radius"
                value={filters.nearMe.radiusKm.toString()}
                onChange={(value) => {
                  if (value && filters.nearMe) {
                    handleFilterChange({
                      ...filters,
                      nearMe: {
                        ...filters.nearMe!,
                        radiusKm: parseInt(value, 10)
                      }
                    });
                  }
                }}
                data={[
                  { value: '1', label: '1 km' },
                  { value: '5', label: '5 km' },
                  { value: '10', label: '10 km' },
                  { value: '20', label: '20 km' }
                ]}
              />
            )}
          </Stack>
        </Popover.Dropdown>
      </Popover>
      
      <Popover opened={activeFilter === 'filters'} onChange={(o) => setActiveFilter(o ? 'filters' : null)}>
        <Popover.Target>
          <div className="filters" onClick={() => setActiveFilter('filters')}>
            <span className="search-label">Filters</span>
            <div className="search-value">
              <IconFilter size={14} style={{ marginRight: '4px' }} />
              Choose filters
            </div>
          </div>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs" p="sm" style={{ width: 300 }}>
            <Checkbox
              label="WiFi Available"
              checked={!!filters.wifi}
              onChange={(e) => handleFilterChange({ ...filters, wifi: e.target.checked })}
            />
            <Checkbox
              label="Power Outlets Available"
              checked={!!filters.powerOutlet}
              onChange={(e) => handleFilterChange({ ...filters, powerOutlet: e.target.checked })}
            />
            <Select
              label="Seating Capacity"
              placeholder="Any"
              value={filters.seatingCapacity?.toString() || ''}
              onChange={(value) => handleFilterChange({ ...filters, seatingCapacity: value ? parseInt(value, 10) : null })}
              data={[
                { value: '1', label: '1-5 people' },
                { value: '2', label: '6-10 people' },
                { value: '3', label: '10+ people' }
              ]}
              clearable
            />
            <Select
              label="Noise Level"
              placeholder="Any"
              value={filters.noiseLevel || ''}
              onChange={(value) => handleFilterChange({ ...filters, noiseLevel: value || null })}
              data={[
                { value: 'quiet', label: 'Quiet' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'loud', label: 'Loud' }
              ]}
              clearable
            />
            <Select
              label="Price Range"
              placeholder="Any"
              value={filters.priceRange || ''}
              onChange={(value) => handleFilterChange({ ...filters, priceRange: value || null })}
              data={[
                { value: '$', label: '$' },
                { value: '$$', label: '$$' },
                { value: '$$$', label: '$$$' },
                { value: '$$$$', label: '$$$$' }
              ]}
              clearable
            />
          </Stack>
        </Popover.Dropdown>
      </Popover>
      
      <Popover opened={activeFilter === 'upvotes'} onChange={(o) => setActiveFilter(o ? 'upvotes' : null)}>
        <Popover.Target>
          <div className="upvotes" onClick={() => setActiveFilter('upvotes')}>
            <span className="search-label">Upvotes</span>
            <div className="search-value">
              <IconThumbUp size={14} style={{ marginRight: '4px' }} />
              {filters.upvotes ? `Min ${filters.upvotes}+` : 'Minimum upvotes'}
            </div>
          </div>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs" p="sm" style={{ width: 250 }}>
            <Select
              label="Minimum Upvotes"
              placeholder="Any"
              value={filters.upvotes?.toString() || ''}
              onChange={(value) => handleFilterChange({ ...filters, upvotes: value ? parseInt(value, 10) : null })}
              data={[
                { value: '10', label: '10+' },
                { value: '25', label: '25+' },
                { value: '50', label: '50+' },
                { value: '100', label: '100+' }
              ]}
              clearable
            />
          </Stack>
        </Popover.Dropdown>
      </Popover>
      
      <button type="submit" className="search-button">
        <IconSearch size={16} />
      </button>
    </form>
  );
}
