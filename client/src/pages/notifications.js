import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.replace("/login"); return; }
    (async () => {
      try {
        const res = await http.get("/api/notifications/my");
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function markRead(id) {
    setBusyId(id);
    try {
      await http.patch(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to mark as read");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNotif(id) {
    if (!window.confirm("Delete this notification?")) return;
    setBusyId(id);
    try {
      await http.delete(`/api/notifications/${id}`);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete notification");
    } finally {
      setBusyId(null);
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6", direction: "ltr" }}>
      <main style={{ padding: "40px 20px", maxWidth: "760px", margin: "0 auto" }}>

        <header style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "#1a1a1a", margin: 0, letterSpacing: "-1px" }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p style={{ color: "#228be6", fontWeight: "700", marginTop: "8px", fontSize: "1rem" }}>
              {unreadCount} unread
            </p>
          )}
        </header>

        {error && (
          <div style={{ background: "#fff5f5", border: "1px solid #ffa8a8", color: "#fa5252", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", textAlign: "center" }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", color: "#868e96", marginTop: "60px", fontSize: "1.1rem" }}>Loading notifications...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔔</div>
            <h3 style={{ color: "#868e96", fontWeight: "700", margin: 0 }}>All caught up!</h3>
            <p style={{ color: "#adb5bd", marginTop: "8px" }}>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {items.map((n) => {
              const meta = typeMeta(n.type);
              return (
                <div
                  key={n.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "14px",
                    padding: "18px 20px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    border: "1px solid",
                    borderColor: n.isRead ? "#f0f0f0" : "#e7f5ff",
                    borderLeft: `4px solid ${n.isRead ? "#dee2e6" : meta.color}`,
                    opacity: n.isRead ? 0.75 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "10px", background: meta.bg, display: "grid", placeItems: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", color: meta.color, background: meta.bg, padding: "2px 8px", borderRadius: "4px" }}>
                            {n.type.replace(/_/g, " ")}
                          </span>
                          {!n.isRead && (
                            <span style={{ fontSize: "0.65rem", fontWeight: "800", background: "#228be6", color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>NEW</span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "0.95rem", color: "#212529", lineHeight: "1.5" }}>{n.message}</p>
                        <div style={{ marginTop: "8px", fontSize: "0.78rem", color: "#adb5bd" }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleString("en-GB") : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n.id)}
                          disabled={busyId === n.id}
                          style={{ padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", background: "#e7f5ff", color: "#228be6", border: "1px solid #74c0fc", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          {busyId === n.id ? "..." : "Mark Read"}
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotif(n.id)}
                        disabled={busyId === n.id}
                        style={{ padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700", background: "#fff5f5", color: "#fa5252", border: "1px solid #ffa8a8", borderRadius: "6px", cursor: "pointer" }}
                      >
                        {busyId === n.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
