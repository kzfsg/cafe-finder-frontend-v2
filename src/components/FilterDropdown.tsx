import { useState } from 'react';
import { 
  Popover, 
  Button, 
  TextInput, 
  Checkbox, 
  NumberInput, 
  Select, 
  Group, 
  Stack,
  Text,
  Divider,
  Loader,
  SegmentedControl
} from '@mantine/core';
import { IconFilter, IconCurrentLocation, IconMapPin } from '@tabler/icons-react';
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
  // Location-based search parameters
  nearMe?: {
    latitude: number;
    longitude: number;
    radiusKm: number; // Search radius in kilometers
  } | null;
}

interface FilterDropdownProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function FilterDropdown({ onFilterChange }: FilterDropdownProps) {
  const [opened, setOpened] = useState(false);
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

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    console.log('🔧 Filter changed:', { key, value });
    const updatedFilters = { ...filters, [key]: value };
    console.log('📋 Updated filters:', updatedFilters);
    setFilters(updatedFilters);
    onFilterChange(updatedFilters); // Make sure we're passing the update up
  };

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      const position = await getCurrentLocation();
      console.log('Got user location:', position);
      
      // Update filters with user's location and default 5km radius
      const updatedFilters = { 
        ...filters, 
        location: '', // Clear text location when using geolocation
        nearMe: {
          latitude: position.latitude,
          longitude: position.longitude,
          radiusKm: 1 // Default radius (changed from 5 to 1)
        }
      };
      
      setFilters(updatedFilters);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to get your location');
      
      // Revert to name-based search if location fails
      const updatedFilters = { ...filters, nearMe: null };
      setFilters(updatedFilters);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const clearFilters = () => {
    const emptyFilters = {
      location: '',
      wifi: false,
      powerOutlet: false,
      seatingCapacity: null,
      noiseLevel: null,
      priceRange: null,
      upvotes: null,
      downvotes: null,
      nearMe: null
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const applyFilters = () => {
    onFilterChange(filters);
    setOpened(false);
  };

  const hasActiveFilters = Object.values(filters).some(
    val => val !== null && val !== '' && val !== false
  );

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width={300}
      position="bottom-end"
      shadow="md"
    >
      <Popover.Target>
        <Button
          variant="light"
          color="gray"
          onClick={() => setOpened((o) => !o)}
          rightSection={<IconFilter size={16} />}
          style={{ borderRadius: '4px', height: '36px' }}
        >
          Filters {hasActiveFilters ? '(Active)' : ''}
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="xs">
          <div>
            <Text fw={500} size="sm" mb={5}>Location Search</Text>
            <SegmentedControl
              data={[
                { label: 'By Name', value: 'name' },
                { label: 'Near Me', value: 'nearMe' }
              ]}
              value={filters.nearMe ? 'nearMe' : 'name'}
              onChange={(value) => {
                if (value === 'name') {
                  // Switch to location name search
                  const updatedFilters = { ...filters, nearMe: null };
                  setFilters(updatedFilters);
                } else if (value === 'nearMe') {
                  // Try to get current location
                  handleGetCurrentLocation();
                }
              }}
              disabled={isLoadingLocation}
              fullWidth
              mb="xs"
            />
            
            {isLoadingLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                <Loader size="xs" />
                <Text size="sm">Getting your location...</Text>
              </div>
            )}
            
            {locationError && (
              <Text color="red" size="xs" mb="xs">
                {locationError}
              </Text>
            )}
            
            {!filters.nearMe ? (
              // Location by name search
              <TextInput
                placeholder="Enter location name"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                leftSection={<IconMapPin size={16} />}
                disabled={isLoadingLocation}
              />
            ) : (
              // Near me search with radius options
              <div>
                <Select
                  label="Search Radius"
                  placeholder="Select radius"
                  value={filters.nearMe?.radiusKm.toString() || '5'}
                  onChange={(value) => {
                    if (value && filters.nearMe) {
                      handleFilterChange('nearMe', {
                        ...filters.nearMe,
                        radiusKm: parseInt(value, 10)
                      });
                    }
                  }}
                  data={[
                    { value: '0.5', label: '0.5km radius' },
                    { value: '1', label: '1km radius' },
                    { value: '3', label: '3km radius' },
                    { value: '5', label: '5km radius' },
                    { value: '10', label: '10km radius' },
                    { value: '15', label: '15km radius' },
                    { value: '25', label: '25km+ radius' }
                  ]}
                  leftSection={<IconCurrentLocation size={16} />}
                />
                <Text size="xs" color="dimmed" mt={5}>
                  Using your location: {filters.nearMe.latitude.toFixed(6)}, {filters.nearMe.longitude.toFixed(6)}
                </Text>
              </div>
            )}
          </div>
          
          <Divider my="sm" />
          
          <Checkbox
            label="WiFi Available"
            checked={filters.wifi || false}
            onChange={(e) => handleFilterChange('wifi', e.target.checked)}
          />
          
          <Checkbox
            label="Power Outlets Available"
            checked={filters.powerOutlet || false}
            onChange={(e) => handleFilterChange('powerOutlet', e.target.checked)}
          />
          
          <NumberInput
            label="Minimum Seating Capacity"
            placeholder="Enter number"
            value={filters.seatingCapacity || ''}
            onChange={(val) => handleFilterChange('seatingCapacity', val)}
            min={0}
          />
          
          <Select
            label="Noise Level"
            placeholder="Select noise level"
            value={filters.noiseLevel || null}
            onChange={(val) => handleFilterChange('noiseLevel', val)}
            data={[
              { value: 'quiet', label: 'Quiet' },
              { value: 'moderate', label: 'Suitable for meetings' },
              { value: 'loud', label: 'Loud' }
            ]}
            clearable
          />
          
          <Select
            label="Price Range"
            placeholder="Select price range"
            value={filters.priceRange || null}
            onChange={(val) => handleFilterChange('priceRange', val)}
            data={[
              { value: '5', label: '$5 and below' },
              { value: '10', label: '$10 and below' },
              { value: '15', label: '$15 and below' },
              { value: '20', label: '$20 and above' }
            ]}
            clearable
          />
          
          <NumberInput
            label="Minimum Upvotes"
            placeholder="Enter number"
            value={filters.upvotes || ''}
            onChange={(val) => handleFilterChange('upvotes', val)}
            min={0}
          />
          
          <NumberInput
            label="Maximum Downvotes"
            placeholder="Enter number"
            value={filters.downvotes || ''}
            onChange={(val) => handleFilterChange('downvotes', val)}
            min={0}
          />
          
          <Group justify="space-between" mt="md">
            <Button variant="subtle" onClick={clearFilters} size="xs">
              Clear All
            </Button>
            <Button onClick={applyFilters} size="xs">
              Apply Filters
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
