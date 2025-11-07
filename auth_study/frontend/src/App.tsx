import { useEffect, useState } from "react";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import Home from "./components/pages/Home";
import { useAuth } from "./components/auth/authContext";

type Page = "login" | "signup" | "home";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const { session, signOut } = useAuth();

  const handleLogout = () => {
    setCurrentPage("login");
    signOut();
  };

  useEffect(() => {
    console.log("session changed(or maybe something else):", session);

    if (session && currentPage !== "home" && !verificationLoading) {
      setCurrentPage("home");
    } else if (!session && currentPage === "home") {
      setCurrentPage("login");
    }
  }, [session, currentPage, verificationLoading]);

  return (
    <>
      {currentPage === "login" ? (
        <Login onNavigateToSignup={() => setCurrentPage("signup")} />
      ) : currentPage === "signup" ? (
        <Signup
          onNavigateToLogin={() => setCurrentPage("login")}
          setVerificationLoading={setVerificationLoading}
        />
      ) : (
        <Home onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
