import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { MainApp } from './pages/MainApp';
import { COLORS } from './constants/theme';

export default function App() {
  const { user, calendarToken, loading, firebaseEnabled, signIn, signOut } = useAuth();

  // Show a blank screen while Firebase resolves the initial auth state
  if (loading) {
    return <div style={{ minHeight: '100vh', background: COLORS.bg }} />;
  }

  // When Firebase is configured and the user is not signed in, show the login page
  if (firebaseEnabled && !user) {
    return <LoginPage onSignIn={signIn} />;
  }

  return (
    <MainApp
      user={user}
      calendarToken={calendarToken}
      firebaseEnabled={firebaseEnabled}
      onSignIn={signIn}
      onSignOut={signOut}
    />
  );
}
