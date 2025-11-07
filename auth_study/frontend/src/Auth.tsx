import { AuthProvider } from "./components/auth/authProvider";
import App from "./App";

function Auth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default Auth;
