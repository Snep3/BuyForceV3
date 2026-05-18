import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { http } from "../../config/http";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setFetching(true);
      const res = await http.get("/api/users/all");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to load users";
      setError(Array.isArray(msg) ? msg.join(" | ") : String(msg));
    } finally {
      setFetching(false);
    }
  }

  async function toggleUser(userId) {
    if (expanded === userId) {
      setExpanded(null);
      return;
    }
    setExpanded(userId);
    if (orders[userId]) return;

    setLoadingOrders(userId);
    try {
      const res = await http.get(`/api/orders/user/${userId}`);
      setOrders((prev) => ({ ...prev, [userId]: Array.isArray(res.data) ? res.data : [] }));
    } catch {
      setOrders((prev) => ({ ...prev, [userId]: [] }));
    } finally {
      setLoadingOrders(null);
    }
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  const statusColor = {
    completed: { bg: "#1b3a2a", color: "#20c997" },
    pending:   { bg: "#1b2e3a", color: "#228be6" },
    cancelled: { bg: "#2c1a1a", color: "#fa5252" },
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .user-row { transition: background 0.15s; }
        .user-row:hover { background: #1e1f22 !important; }
        .expand-btn { background: none; border: none; color: #909296; cursor: pointer; font-size: 1rem; padding: 4px 8px; border-radius: 4px; transition: color 0.15s; }
        .expand-btn:hover { color: #fff; }
        .order-row:last-child td { border-bottom: none !important; }
      `}</style>

      <div style={{ minHeight: "100vh", backgroundColor: "#141517", color: "#c1c2c5", direction: "ltr" }}>

        {/* Header */}
        <div style={{ background: "#1a1b1e", borderBottom: "1px solid #2c2e33", padding: "16px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#fff" }}>
            <span style={{ color: "#228be6" }}>Buy</span>Force
          </span>
          <span style={{ background: "#f08c00", color: "#fff", padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "900", letterSpacing: "1px" }}>ADMIN</span>
          <span style={{ color: "#909296", fontSize: "0.9rem", marginLeft: "8px" }}>/ Users</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "20px" }}>
            <a href="/admin/groups" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Groups</a>
            <a href="/admin/products" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Products</a>
            <a href="/" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Home</a>
          </div>
        </div>

        <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "900", color: "#fff" }}>Users</h1>
            {!fetching && (
              <span style={{ color: "#909296", fontSize: "0.9rem" }}>{users.length} registered users</span>
            )}
          </div>

          {error && (
            <div style={{ background: "#2c1a1a", border: "1px solid #5c2020", color: "#fa5252", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          {fetching ? (
            <div style={{ textAlign: "center", padding: "80px", color: "#909296", fontSize: "1.1rem" }}>Loading users...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", color: "#909296" }}>No users found.</div>
          ) : (
            <div style={{ background: "#1a1b1e", borderRadius: "12px", border: "1px solid #2c2e33", overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 80px 110px 40px", gap: "0", padding: "12px 20px", borderBottom: "1px solid #2c2e33", background: "#25262b" }}>
                {["#", "Username", "Email", "Role", "Joined", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: "0.72rem", fontWeight: "800", color: "#5c5f66", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</span>
                ))}
              </div>

              {users.map((u, idx) => (
                <div key={u.id}>
                  {/* User row */}
                  <div
                    className="user-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr 1fr 80px 110px 40px",
                      gap: "0",
                      padding: "14px 20px",
                      borderBottom: "1px solid #25262b",
                      background: expanded === u.id ? "#1e2a38" : "transparent",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleUser(u.id)}
                  >
                    <span style={{ color: "#5c5f66", fontSize: "0.85rem" }}>{idx + 1}</span>
                    <span style={{ fontWeight: "700", color: "#fff", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.username || "—"}
                    </span>
                    <span style={{ color: "#909296", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.email}
                    </span>
                    <span>
                      {u.is_admin ? (
                        <span style={{ background: "#3a1f6e", color: "#be4bdb", fontSize: "0.7rem", fontWeight: "800", padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.5px" }}>ADMIN</span>
                      ) : (
                        <span style={{ background: "#1b2e3a", color: "#74c0fc", fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "4px" }}>USER</span>
                      )}
                    </span>
                    <span style={{ color: "#5c5f66", fontSize: "0.82rem" }}>{formatDate(u.createdAt)}</span>
                    <span style={{ color: expanded === u.id ? "#228be6" : "#5c5f66", fontSize: "0.9rem", textAlign: "center" }}>
                      {expanded === u.id ? "▲" : "▼"}
                    </span>
                  </div>

                  {/* Orders panel */}
                  {expanded === u.id && (
                    <div style={{ background: "#111214", borderBottom: "1px solid #25262b", padding: "16px 20px 20px 60px" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#5c5f66", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                        Purchase History
                      </div>

                      {loadingOrders === u.id ? (
                        <div style={{ color: "#909296", fontSize: "0.85rem" }}>Loading orders...</div>
                      ) : !orders[u.id] || orders[u.id].length === 0 ? (
                        <div style={{ color: "#5c5f66", fontSize: "0.85rem" }}>No orders yet.</div>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              {["Product(s)", "Status", "Total", "Date"].map((h) => (
                                <th key={h} style={{ textAlign: "left", fontSize: "0.72rem", fontWeight: "800", color: "#5c5f66", textTransform: "uppercase", letterSpacing: "0.6px", paddingBottom: "8px", borderBottom: "1px solid #2c2e33" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {orders[u.id].map((order) => {
                              const sc = statusColor[order.status] || { bg: "#25262b", color: "#909296" };
                              const productNames = order.items?.length
                                ? order.items.map((it) => `${it.product?.name || "Unknown"}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(", ")
                                : "—";
                              return (
                                <tr key={order.id} className="order-row">
                                  <td style={{ padding: "10px 0", borderBottom: "1px solid #1e1f22", color: "#c1c2c5", fontSize: "0.85rem", paddingRight: "16px" }}>
                                    {productNames}
                                  </td>
                                  <td style={{ padding: "10px 0", borderBottom: "1px solid #1e1f22", paddingRight: "16px" }}>
                                    <span style={{ background: sc.bg, color: sc.color, fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 0", borderBottom: "1px solid #1e1f22", color: "#20c997", fontWeight: "700", fontSize: "0.85rem", paddingRight: "16px" }}>
                                    ₪{Number(order.totalPrice).toLocaleString()}
                                  </td>
                                  <td style={{ padding: "10px 0", borderBottom: "1px solid #1e1f22", color: "#5c5f66", fontSize: "0.82rem" }}>
                                    {formatDate(order.createdAt)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
