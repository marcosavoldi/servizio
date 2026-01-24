import { Group, Box, Text, ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface CustomModalHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  action?: ReactNode;
}

export default function CustomModalHeader({ title, subtitle, onClose, action }: CustomModalHeaderProps) {
  return (
    <Group justify="space-between" align="start" p="md" pb="xs" w="100%" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="xl" tt="capitalize" lh={1.2}>
                {title}
            </Text>
            {subtitle && (
                <Text size="md" c="dimmed" tt="capitalize" lh={1.2}>
                    {subtitle}
                </Text>
            )}
        </Box>
        <Group gap="sm" wrap="nowrap">
            {action}
            <ActionIcon 
                variant="light" 
                color="red" 
                size="lg" 
                radius="md"
                onClick={onClose}
                style={{ flexShrink: 0 }}
            >
                <IconX size={22} stroke={2.5} />
            </ActionIcon>
        </Group>
    </Group>
  );
}
