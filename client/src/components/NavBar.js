import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { http } from "../config/http";

const TYPE_META = {
  GROUP_JOIN:      { icon: "✅", color: "#20c997", bg: "#ebfbee" },
  GROUP_LEAVE:     { icon: "👋", color: "#f08c00", bg: "#fff4e6" },
  GROUP_COMPLETED: { icon: "🎉", color: "#228be6", bg: "#e7f5ff" },
  GROUP_THRESHOLD: { icon: "🔥", color: "#fa5252", bg: "#fff5f5" },
};
function typeMeta(type) {
  return TYPE_META[type] || { icon: "🔔", color: "#868e96", bg: "#f1f3f5" };
}

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("user");
    setUser(raw ? JSON.parse(raw) : null);
  }, [router.pathname]);

  useEffect(() => {
    if (!user) return;
    http.get("/api/notifications/my")
      .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [user]);

  async function openDrawer() {
    setDrawerOpen(true);
    try {
      const res = await http.get("/api/notifications/my");
      const fresh = Array.isArray(res.data) ? res.data : [];
      setNotifications(fresh);
      const unread = fresh.filter((n) => !n.isRead);
      if (unread.length > 0) {
        await Promise.all(unread.map((n) => http.patch(`/api/notifications/${n.id}/read`).catch(() => {})));
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch {}
  }

  async function deleteNotif(id) {
    try {
      await http.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  }

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
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
                <Link href="/admin/users" style={{ ...navLinkStyle("/admin/users"), color: isActive("/admin/users") ? "#f08c00" : "#868e96" }}>
                  Users ✦
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div style={rightStyle}>
            {user ? (
              <>
                {/* Bell */}
                <div style={{ position: "relative" }}>
                  <button onClick={openDrawer} style={bellBtnStyle} title="Notifications">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212529" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </button>
                  {unreadCount > 0 && (
                    <span style={badgeStyle}>{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </div>

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

      {/* Overlay */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={overlayStyle} />
      )}

      {/* Drawer */}
      <div style={{ ...drawerStyle, transform: drawerOpen ? "translateX(0)" : "translateX(100%)" }}>
        {/* Drawer header */}
        <div style={drawerHeaderStyle}>
          <span style={{ fontWeight: "800", fontSize: "1.1rem", color: "#111" }}>Notifications</span>
          <button onClick={() => setDrawerOpen(false)} style={drawerCloseStyle}>✕</button>
        </div>

        {/* Notification list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#adb5bd" }}>
              <div style={{ marginBottom: "12px" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
              <p style={{ fontWeight: "600", margin: 0 }}>All caught up!</p>
              <p style={{ fontSize: "0.85rem", marginTop: "6px" }}>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const meta = typeMeta(n.type);
              return (
                <div key={n.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #f0f0f0", borderLeft: `4px solid ${meta.color}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "8px", background: meta.bg, display: "grid", placeItems: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", color: meta.color, marginBottom: "4px" }}>
                        {n.type.replace(/_/g, " ")}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "#212529", lineHeight: 1.5 }}>{n.message}</p>
                      <div style={{ marginTop: "6px", fontSize: "0.73rem", color: "#adb5bd" }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleString("en-GB") : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteNotif(n.id)}
                      style={{ background: "none", border: "none", color: "#adb5bd", cursor: "pointer", fontSize: "1rem", padding: "2px 4px", flexShrink: 0, lineHeight: 1 }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
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
const logoStyle = { textDecoration: "none", fontSize: "1.3rem", fontWeight: "900", color: "#111", letterSpacing: "-0.5px", flexShrink: 0 };
const logoAccentStyle = { color: "#228be6" };
const linksStyle = { display: "flex", alignItems: "center", gap: "1.2rem", flex: 1 };
const rightStyle = { display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto", flexShrink: 0 };
const avatarLinkStyle = { textDecoration: "none" };
const avatarStyle = { width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e9ecef", cursor: "pointer", transition: "border-color 0.2s" };
const usernameStyle = { fontSize: "14px", fontWeight: "600", color: "#212529", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const logoutStyle = { cursor: "pointer", border: "1px solid #fa5252", background: "none", color: "#fa5252", padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", transition: "all 0.2s", fontFamily: "inherit" };
const loginLinkStyle = { color: "#495057", fontSize: "14px", fontWeight: "600", textDecoration: "none" };
const registerBtnStyle = { backgroundColor: "#228be6", color: "#fff", padding: "7px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "700", textDecoration: "none", transition: "background 0.2s" };
const bellBtnStyle = { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "4px", borderRadius: "8px", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" };
const badgeStyle = { position: "absolute", top: "-6px", right: "-6px", background: "#fa5252", color: "#fff", fontSize: "0.6rem", fontWeight: "900", minWidth: "18px", height: "18px", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid #fff", pointerEvents: "none" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1100 };
const drawerStyle = { position: "fixed", top: 0, right: 0, width: "380px", maxWidth: "100vw", height: "100vh", background: "#f8f9fa", zIndex: 1200, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)" };
const drawerHeaderStyle = { padding: "18px 20px", background: "#fff", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 };
const drawerCloseStyle = { background: "none", border: "none", fontSize: "1rem", cursor: "pointer", color: "#868e96", padding: "4px 8px", borderRadius: "6px", fontFamily: "inherit" };
