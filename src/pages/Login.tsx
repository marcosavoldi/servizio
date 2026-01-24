import { Button, Container, Paper, Title, Text, Center, Stack } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <Container size="xs" h="100vh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper radius="md" p="xl" withBorder style={{ width: '100%' }}>
        <Stack gap="lg">
          <Center>
            <Title order={2}>Agenda Servizio</Title>
          </Center>
          
          <Text c="dimmed" size="sm" ta="center">
            Accedi per gestire il tuo rapporto di servizio
          </Text>

          <Button 
            leftSection={<IconBrandGoogle size={20} />} 
            variant="default" 
            color="gray" 
            onClick={login}
            fullWidth
          >
            Accedi con Google
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
