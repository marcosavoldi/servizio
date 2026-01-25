import { Tooltip, ActionIcon } from '@mantine/core';
import { useNetwork } from '@mantine/hooks';
import { IconCloudCheck, IconCloudOff } from '@tabler/icons-react';

export default function NetworkStatus() {
  const networkState = useNetwork();
  
  const online = networkState.online;

  return (
    <Tooltip 
        label={online ? "Online: Modifiche salvate e sincronizzate" : "Offline: Modifiche salvate in locale"}
        color={online ? "teal" : "orange"}
        withArrow
    >
      <ActionIcon 
        variant="light" 
        color={online ? "teal" : "orange"} 
        size="lg" 
        radius="md"
        style={{ cursor: 'default' }}
      >
        {online ? <IconCloudCheck size={22} /> : <IconCloudOff size={22} />}
      </ActionIcon>
    </Tooltip>
  );
}
