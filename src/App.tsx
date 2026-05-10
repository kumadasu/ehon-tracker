import { MainApp } from './pages/MainApp';

// Auth gate will be added in Phase 4 (Firebase Auth).
// For now render MainApp directly with localStorage persistence.
export default function App() {
  return <MainApp />;
}
