import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("user");
    setUser(raw ? JSON.parse(raw) : null);
  }, [router.pathname]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  const isActive = (href) => {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  };

  const navLinkStyle = (href) => ({
    textDecoration: "none",
    color: isActive(href) ? "#228be6" : "#495057",
    fontWeight: isActive(href) ? "700" : "500",
    fontSize: "14px",
    padding: "6px 4px",
    borderBottom: isActive(href) ? "2px solid #228be6" : "2px solid transparent",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        {/* Logo */}
        <Link href="/" style={logoStyle}>
          <span style={logoAccentStyle}>Buy</span>Force
        </Link>

        {/* Center links */}
        <div style={linksStyle}>
          <Link href="/" style={navLinkStyle("/")}>Home</Link>
          <Link href="/products" style={navLinkStyle("/products")}>Products</Link>
          {user && (
            <>
              <Link href="/my-groups" style={navLinkStyle("/my-groups")}>My Groups</Link>
              <Link href="/my-orders" style={navLinkStyle("/my-orders")}>Orders</Link>
              <Link href="/wishlist" style={navLinkStyle("/wishlist")}>Wishlist</Link>
              <Link href="/notifications" style={navLinkStyle("/notifications")}>Notifications</Link>
            </>
          )}
          {user?.is_admin && (
            <>
              <span style={{ color: "#dee2e6", fontSize: "18px" }}>|</span>
              <Link href="/admin/products" style={{ ...navLinkStyle("/admin/products"), color: isActive("/admin/products") ? "#f08c00" : "#868e96" }}>
                Products ✦
              </Link>
              <Link href="/admin/groups" style={{ ...navLinkStyle("/admin/groups"), color: isActive("/admin/groups") ? "#f08c00" : "#868e96" }}>
                Groups ✦
              </Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div style={rightStyle}>
          {user ? (
            <>
              <Link href="/profile" style={avatarLinkStyle} title="Profile">
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username || "U")}&background=228be6&color=fff&bold=true`}
                  alt="avatar"
                  style={avatarStyle}
                />
              </Link>
              <span style={usernameStyle}>{user.fullName || user.username}</span>
              <button onClick={logout} style={logoutStyle}>Logout</button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Link href="/login" style={loginLinkStyle}>Sign In</Link>
              <Link href="/register" style={registerBtnStyle}>Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const navStyle = {
  position: "sticky",
  top: 0,
  zIndex: 1000,
  backgroundColor: "#fff",
  borderBottom: "1px solid #f1f3f5",
  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
};

const innerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "0 1.5rem",
  height: "60px",
  display: "flex",
  alignItems: "center",
  gap: "2rem",
};

const logoStyle = {
  textDecoration: "none",
  fontSize: "1.3rem",
  fontWeight: "900",
  color: "#111",
  letterSpacing: "-0.5px",
  flexShrink: 0,
};

const logoAccentStyle = {
  color: "#228be6",
};

const linksStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1.2rem",
  flex: 1,
};

const rightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginLeft: "auto",
  flexShrink: 0,
};

const avatarLinkStyle = { textDecoration: "none" };

const avatarStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid #e9ecef",
  cursor: "pointer",
  transition: "border-color 0.2s",
};

const usernameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#212529",
  maxWidth: "120px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const logoutStyle = {
  cursor: "pointer",
  border: "1px solid #fa5252",
  background: "none",
  color: "#fa5252",
  padding: "5px 12px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "700",
  transition: "all 0.2s",
  fontFamily: "inherit",
};

const loginLinkStyle = {
  color: "#495057",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
};

const registerBtnStyle = {
  backgroundColor: "#228be6",
  color: "#fff",
  padding: "7px 16px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "700",
  textDecoration: "none",
  transition: "background 0.2s",
};
