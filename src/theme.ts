import { createTheme } from '@mantine/core';

export const theme = createTheme({
    primaryColor: 'teal',
    defaultRadius: 'md',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    headings: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    components: {
        Button: {
            defaultProps: {
                fw: 500,
            }
        },
        Modal: {
            defaultProps: {
                // Ensure modals are usable on mobile
                transitionProps: { transition: 'pop' },
            }
        }
    }
});
