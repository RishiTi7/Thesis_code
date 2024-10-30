import { Stack } from 'expo-router';
import { UserInactivityProvider } from '~/context/userInactivity';

export default function Layout() {
  return (
    <UserInactivityProvider>
      <Stack>
        <Stack.Screen 
          name="(modals)/lock" 
          options={{
            headerShown: false, 
            animation:'none',
          }}
        />
        <Stack.Screen
          name = "(modals)/white"
          options = {{
            headerShown: false,
            animation: 'none',
          }}
        />
      </Stack>
    </UserInactivityProvider>
    );
}
