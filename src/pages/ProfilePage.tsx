import { Container, Title, Text, Paper, Avatar, Group, Stack, Button } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Title order={2} mb="md">Please log in to view your profile</Title>
        <Button component={Link} to="/login" variant="filled">
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 60px)',
      backgroundColor: '#F0F2F5',
      padding: '2rem 0'
    }}>
      <Container size="md">
        <Paper 
          p="xl" 
          radius="lg" 
          shadow="sm" 
          style={{ 
            backgroundColor: 'white',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          <Group align="flex-start" gap="xl">
            <Avatar 
              src={user.avatar} 
              size={120} 
              radius={60}
              style={{ border: '3px solid #F0F2F5' }}
            />
            
            <Stack gap="xs" style={{ flex: 1 }}>
              <Title order={2} style={{ marginBottom: '1rem' }}>
                {user.name || 'User Profile'}
              </Title>
              
              <div>
                <Text size="sm" color="dimmed">Email</Text>
                <Text size="lg">{user.email}</Text>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <Text size="sm" color="dimmed">Member Since</Text>
                <Text size="md">
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </div>
              
              <Button 
                component={Link} 
                to="/profile/edit" 
                variant="outline" 
                style={{ marginTop: '1.5rem', width: 'fit-content' }}
              >
                Edit Profile
              </Button>
            </Stack>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}
