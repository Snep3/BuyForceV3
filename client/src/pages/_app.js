// client/src/pages/_app.js
import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NavBar from "../components/NavBar";

function getAuth() {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  return { token, user };
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setIsDark(saved);
    const isAdmin = router.pathname.startsWith("/admin");
    document.documentElement.classList.toggle("dark-mode", saved && !isAdmin);
  }, []);

  useEffect(() => {
    const isAdmin = router.pathname.startsWith("/admin");
    document.documentElement.classList.toggle("dark-mode", isDark && !isAdmin);
  }, [router.pathname, isDark]);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("darkMode", String(next));
  }

  useEffect(() => {
    const isAdminRoute = router.pathname.startsWith("/admin");
    if (!isAdminRoute) return;
    const { token, user } = getAuth();
    if (!token || !user?.is_admin) {
      router.replace("/login");
    }
  }, [router.pathname]);

  const hideNav = router.pathname === "/login" || router.pathname === "/register";
  const isAdminPage = router.pathname.startsWith("/admin");

  return (
    <>
      {!hideNav && <NavBar />}
      <Component {...pageProps} />
      {!isAdminPage && <button
        onClick={toggleDark}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "none",
          background: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >

        {isDark ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#212529" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212529" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>}
    </>
  );
}
