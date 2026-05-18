import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { http } from "../config/http";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", avatarUrl: "" });

  async function loadData() {
    try {
      setError("");
      const [userRes, groupsRes, ordersRes] = await Promise.all([
        http.get("/api/users/me"),
        http.get("/api/groups/my"),
        http.get("/api/orders/my"),
      ]);
      setProfile(userRes.data);
      setMyGroups(groupsRes.data || []);
      setMyOrders(ordersRes.data || []);
      setForm({
        fullName: userRes.data.fullName || "",
        phone: userRes.data.phone || "",
        address: userRes.data.address || "",
        avatarUrl: userRes.data.avatarUrl || "",
      });
    } catch (e) {
      if (e?.response?.status === 401) router.replace("/login");
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await http.patch("/api/users/me", form);
      setProfile(res.data);
      setIsEditing(false);
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("user");
        const current = raw ? JSON.parse(raw) : {};
        localStorage.setItem("user", JSON.stringify({ ...current, ...res.data }));
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "1.1rem", color: "#868e96" }}>
        Loading profile...
      </div>
    );
  }

  const initials = (profile?.fullName || profile?.username || "U").slice(0, 2).toUpperCase();
  const activeGroups = myGroups.filter((g) => !g.isCompleted).length;
  const completedGroups = myGroups.filter((g) => g.isCompleted).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6", direction: "ltr" }}>
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>

        {error && (
          <div style={{ background: "#fff5f5", border: "1px solid #ffa8a8", color: "#fa5252", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* Profile Card */}
        <section style={{ backgroundColor: "#fff", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "28px" }}>
          {/* Cover */}
          <div style={{ height: "140px", background: "linear-gradient(135deg, #228be6 0%, #15aabf 100%)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
          </div>

          {/* Header */}
          <div style={{ padding: "0 32px 28px", marginTop: "-60px", display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
            <div style={{ width: 110, height: 110, borderRadius: "50%", border: "5px solid #fff", backgroundColor: "#228be6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "2rem", fontWeight: "900", color: "#fff" }}>{initials}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: "200px", paddingBottom: "4px" }}>
              <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "900", color: "#1a1a1a" }}>
                {profile?.fullName || profile?.username || "User"}
              </h1>
              <p style={{ margin: "4px 0 0", color: "#868e96", fontSize: "0.95rem" }}>
                {profile?.email} · Member since {new Date(profile?.createdAt).getFullYear()}
              </p>
              {(profile?.phone || profile?.address) && (
                <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {profile.phone && (
                    <span style={{ fontSize: "0.85rem", color: "#495057" }}>📞 {profile.phone}</span>
                  )}
                  {profile.address && (
                    <span style={{ fontSize: "0.85rem", color: "#495057" }}>📍 {profile.address}</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{ padding: "10px 22px", borderRadius: "10px", border: "1.5px solid #dee2e6", backgroundColor: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "0.9rem", color: "#228be6", flexShrink: 0 }}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Stats */}
          {!isEditing && (
            <div style={{ display: "flex", gap: "0", borderTop: "1px solid #f0f0f0" }}>
              {[
                { label: "Groups Joined", value: myGroups.length },
                { label: "Active Groups", value: activeGroups },
                { label: "Completed", value: completedGroups },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, padding: "20px", textAlign: "center", borderRight: i < 2 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ fontSize: "2rem", fontWeight: "900", color: "#228be6" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.8rem", color: "#868e96", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <form onSubmit={save} style={{ padding: "24px 32px 32px", borderTop: "1px solid #f0f0f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { label: "Full Name", key: "fullName", placeholder: "Your full name" },
                { label: "Phone", key: "phone", placeholder: "+1 234 567 8900" },
                { label: "Address", key: "address", placeholder: "Your address" },
                { label: "Avatar URL", key: "avatarUrl", placeholder: "https://example.com/avatar.jpg" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: "800", color: "#868e96", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ padding: "10px 14px", border: "1.5px solid #dee2e6", borderRadius: "10px", fontSize: "0.95rem", outline: "none", transition: "border-color 0.2s" }}
                    onFocus={(e) => (e.target.style.borderColor = "#228be6")}
                    onBlur={(e) => (e.target.style.borderColor = "#dee2e6")}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ width: "100%", padding: "13px", background: "#228be6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "1rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* My Groups */}
        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
            My Groups Activity
          </h2>
          {myGroups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#adb5bd" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🛍️</div>
              <p style={{ fontStyle: "italic", marginBottom: "16px" }}>You haven't joined any groups yet.</p>
              <button onClick={() => router.push("/")} style={{ padding: "10px 22px", background: "#228be6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" }}>
                Browse Active Deals
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {myGroups.map((group) => {
                const progress = group.progress ?? 0;
                return (
                  <div
                    key={group.id}
                    onClick={() => group.productId && router.push(`/products/${group.productId}`)}
                    style={{ backgroundColor: "#fff", padding: "18px", borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", cursor: group.productId ? "pointer" : "default", transition: "box-shadow 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "#1a1a1a", lineHeight: "1.3" }}>{group.name}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: "800", padding: "3px 8px", borderRadius: "6px", whiteSpace: "nowrap", marginLeft: "8px", background: group.isCompleted ? "#ebfbee" : "#e7f5ff", color: group.isCompleted ? "#2f9e44" : "#228be6" }}>
                        {group.isCompleted ? "Completed" : "Active"}
                      </span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#f1f3f5", borderRadius: "4px", overflow: "hidden", marginBottom: "8px" }}>
                      <div style={{ width: `${Math.min(progress, 100)}%`, height: "100%", backgroundColor: group.isCompleted ? "#20c997" : "#228be6", borderRadius: "4px", transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#868e96" }}>
                      <span>{group.currentParticipants}/{group.minParticipants} members</span>
                      <span style={{ fontWeight: "700", color: group.isCompleted ? "#20c997" : "#228be6" }}>{progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Orders */}
        <section style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
            Recent Orders
          </h2>
          {myOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#adb5bd" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📦</div>
              <p style={{ fontStyle: "italic" }}>No orders yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {myOrders.slice(0, 5).map((order) => {
                const productNames = order.items?.length
                  ? order.items.map((it) => `${it.product?.name || "Unknown"}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(", ")
                  : "—";
                const statusColors = {
                  completed: { bg: "#ebfbee", color: "#2f9e44" },
                  pending:   { bg: "#e7f5ff", color: "#228be6" },
                  cancelled: { bg: "#fff5f5", color: "#fa5252" },
                };
                const sc = statusColors[order.status] || { bg: "#f1f3f5", color: "#868e96" };
                return (
                  <div key={order.id} style={{ backgroundColor: "#fff", padding: "16px 20px", borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "160px" }}>
                      <div style={{ fontWeight: "700", color: "#1a1a1a", fontSize: "0.9rem", marginBottom: "3px" }}>{productNames}</div>
                      <div style={{ fontSize: "0.78rem", color: "#adb5bd" }}>{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    </div>
                    <span style={{ background: sc.bg, color: sc.color, fontSize: "0.72rem", fontWeight: "800", padding: "3px 10px", borderRadius: "6px", textTransform: "uppercase" }}>
                      {order.status}
                    </span>
                    <div style={{ fontWeight: "800", color: "#228be6", fontSize: "1rem", minWidth: "60px", textAlign: "right" }}>
                      ₪{Number(order.totalPrice).toLocaleString()}
                    </div>
                  </div>
                );
              })}
              {myOrders.length > 5 && (
                <button onClick={() => router.push("/my-orders")} style={{ alignSelf: "center", padding: "9px 22px", background: "none", border: "1.5px solid #dee2e6", borderRadius: "10px", color: "#228be6", fontWeight: "700", cursor: "pointer", fontSize: "0.875rem" }}>
                  View all {myOrders.length} orders →
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
