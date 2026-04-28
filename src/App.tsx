import { useAuth } from './context/AuthContext';
import { TokenGate } from './components/TokenGate';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const { token } = useAuth();

  if (!token) {
    return <TokenGate />;
  }

  return <Dashboard />;
}
