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

  return;
}
