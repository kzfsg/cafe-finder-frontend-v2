import { useState } from 'react';
import { Container, Title, Text, Grid, Card, Badge, Group, TextInput, Select, Button } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconSearch, IconWifi, IconPlug } from '@tabler/icons-react';

// This would be replaced with actual API calls
const fetchCafes = async () => {
  // Mock data for now
  return [
    {
      id: 1,
      name: 'The Coffee House',
      address: '123 Main St, Singapore',
      image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      rating: 4.5,
      reviewCount: 128,
      wifiSpeed: 'fast' as WifiSpeed,
      hasPowerOutlets: true,
      noiseLevel: 'moderate' as NoiseLevel,
      seatingCapacity: 'medium' as SeatingCapacity,
      openNow: true,
      openingHours: '7:00 AM - 10:00 PM',
    },
    // Add more mock data as needed
  ];
};

type WifiSpeed = 'slow' | 'moderate' | 'fast';
type NoiseLevel = 'quiet' | 'moderate' | 'loud';
type SeatingCapacity = 'small' | 'medium' | 'large';

type Cafe = {
  id: number;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  wifiSpeed: WifiSpeed;
  hasPowerOutlets: boolean;
  noiseLevel: NoiseLevel;
  seatingCapacity: SeatingCapacity;
  openNow: boolean;
  openingHours: string;
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWifiSpeed, setSelectedWifiSpeed] = useState<WifiSpeed | null>(null);
  const [hasPowerOutlets, setHasPowerOutlets] = useState<boolean | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel | null>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<SeatingCapacity | null>(null);
  const { data: cafes = [] } = useQuery<Cafe[]>({
    queryKey: ['cafes'],
    queryFn: fetchCafes,
  });

  const filteredCafes = cafes.filter((cafe: Cafe) => {
    // Filter by search query
    if (searchQuery && !cafe.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by WiFi speed
    if (selectedWifiSpeed && cafe.wifiSpeed !== selectedWifiSpeed) {
      return false;
    }
    
    // Filter by power outlets
    if (hasPowerOutlets !== null && cafe.hasPowerOutlets !== hasPowerOutlets) {
      return false;
    }
    
    // Filter by noise level
    if (noiseLevel && cafe.noiseLevel !== noiseLevel) {
      return false;
    }
    
    // Filter by seating capacity
    if (selectedCapacity && cafe.seatingCapacity !== selectedCapacity) {
      return false;
    }
    
    return true;
  });

  const wifiSpeedOptions = [
    { value: 'fast', label: 'Fast' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'slow', label: 'Slow' },
  ];

  const noiseLevelOptions = [
    { value: 'quiet', label: 'Quiet' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'loud', label: 'Lively' },
  ];

  const capacityOptions = [
    { value: 'small', label: 'Small (1-10)' },
    { value: 'medium', label: 'Medium (10-30)' },
    { value: 'large', label: 'Large (30+)' },
  ];

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl" style={{ textAlign: 'center' }}>Find Your Perfect Workspace</Title>
      
      {/* Search and Filters */}
      <Card withBorder shadow="sm" radius="md" mb="xl">
        <Grid gutter="md">
          <Grid.Col span={{base: 12, md: 8}}>
            <TextInput
              placeholder="Search for cafes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={18} />}
            />
          </Grid.Col>
          <Grid.Col span={{base: 12, md: 4}}>
            <Select
              placeholder="WiFi Speed"
              data={wifiSpeedOptions}
              value={selectedWifiSpeed}
              onChange={(value) => setSelectedWifiSpeed(value as WifiSpeed)}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{base: 6, md: 3}}>
            <Select
              placeholder="Noise Level"
              data={noiseLevelOptions}
              value={noiseLevel}
              onChange={(value) => setNoiseLevel(value as NoiseLevel)}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{base: 6, md: 3}}>
            <Select
              placeholder="Seating Capacity"
              data={capacityOptions}
              value={selectedCapacity}
              onChange={(value) => setSelectedCapacity(value as SeatingCapacity)}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{base: 12, md: 3}}>
            <Button
              fullWidth
              variant={hasPowerOutlets === true ? 'filled' : 'outline'}
              leftSection={<IconPlug size={18} />}
              onClick={() => setHasPowerOutlets(hasPowerOutlets === true ? null : true)}
            >
              {hasPowerOutlets === true ? 'Power Outlets' : 'No Power Outlets'}
            </Button>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Cafe List */}
      <Grid gutter="md">
        {filteredCafes.map((cafe) => (
          <Grid.Col key={cafe.id} span={{base: 12, md: 6}}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Card.Section>
                <img 
                  src={cafe.image} 
                  alt={cafe.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              </Card.Section>

              <Text fw={500} size="lg" mt="md">
                {cafe.name}
              </Text>
              
              <Text size="sm" c="dimmed">
                {cafe.address}
              </Text>

              <Group gap="sm" mt="md">
                <Badge color="blue" variant="light">
                  {cafe.wifiSpeed} WiFi
                </Badge>
                <Badge color="green" variant="light">
                  {cafe.seatingCapacity} Seating
                </Badge>
                <Badge color="yellow" variant="light">
                  {cafe.noiseLevel} Noise
                </Badge>
              </Group>

              <Text size="sm" mt="md">
                Open: {cafe.openingHours}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}
