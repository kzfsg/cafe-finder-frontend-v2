import React, { useState } from 'react';
import { 
  Popover, 
  Button, 
  TextInput, 
  Checkbox, 
  NumberInput, 
  Select, 
  Group, 
  Stack 
} from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';

export interface FilterOptions {
  location?: string;
  wifi?: boolean;
  powerOutlet?: boolean;
  seatingCapacity?: number | null;
  noiseLevel?: string | null;
  priceRange?: string | null;
  upvotes?: number | null;
  downvotes?: number | null;
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
    downvotes: null
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
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
      downvotes: null
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
          <TextInput
            label="Location"
            placeholder="Enter location"
            value={filters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
          
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
