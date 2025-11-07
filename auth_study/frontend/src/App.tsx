import { AuthProvider } from "./components/auth/authProvider";
import AppContent from "./AppContent";

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
