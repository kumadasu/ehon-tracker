import { useAuth } from './hooks/useAuth';
import { MainApp } from './pages/MainApp';
import { COLORS } from './constants/theme';

export default function App() {
  const auth = useAuth();

  // Show a blank screen while restoring session from sessionStorage
  if (auth.loading) {
    return <div style={{ minHeight: '100vh', background: COLORS.bg }} />;
  }

  return <MainApp auth={auth} />;
}
