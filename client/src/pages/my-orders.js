import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import Link from "next/link";
import { useRouter } from "next/router";

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchOrders = async (token) => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchOrders(token);
  }, [router]);

  const handleCancelOrder = async (order) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const groupId = order.groupId || (order.group && order.group.id);

    if (!groupId) {
      alert("Error: Could not find the group ID for this order.");
      return;
    }

    const ok = window.confirm("Are you sure you want to cancel this order?");
    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}/join`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Order cancelled successfully");
      fetchOrders(token);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel order");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { color: '#f08c00', bg: '#fff4e6' };
      case 'completed': return { color: '#2b8a3e', bg: '#ebfbee' };
      case 'cancelled': return { color: '#c92a2a', bg: '#fff5f5' };
      default: return { color: '#495057', bg: '#f1f3f5' };
    }
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.group?.name?.toLowerCase().includes(q) ||
      o.items?.some((i) => i.product?.name?.toLowerCase().includes(q))
    );
  });

  return (
    <div style={pageWrapperStyle}>
      {/* Banner */}
      <div style={bannerStyle}>
        <div style={bannerInnerStyle}>
          <h1 style={bannerTitleStyle}>My Orders</h1>
          <p style={bannerSubStyle}>Track your purchases and group orders in one place.</p>
          <div style={searchWrapStyle}>
            <span style={searchIconStyle}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, group or order ID..."
              style={searchInputStyle}
            />
          </div>
        </div>
      </div>

      <main style={mainContentStyle}>
        {loading ? (
          <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading orders...</p>
        ) : error ? (
          <div style={errorCardStyle}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={emptyStateStyle}>
            {search ? (
              <>
                <h3>No orders match "{search}"</h3>
                <button onClick={() => setSearch("")} style={{ marginTop: "1rem", padding: "8px 20px", background: "#228be6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Clear search</button>
              </>
            ) : (
              <>
                <h3>No orders yet</h3>
                <Link href="/" style={shopLinkStyle}>Start Shopping</Link>
              </>
            )}
          </div>
        ) : (
          <div style={ordersGridStyle}>
            {filtered.map((order) => {
              const statusColors = getStatusStyle(order.status);
              return (
                <div key={order.id} style={orderCardStyle}>
                  <div style={orderHeaderStyle}>
                    <div>
                      <span style={orderNumberStyle}>Order #{order.id}</span>
                      <div style={dateStyle}>
                        {new Date(order.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <span style={{
                      ...statusBadgeStyle,
                      color: statusColors.color,
                      backgroundColor: statusColors.bg
                    }}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={itemsSectionStyle}>
                    {order.items?.map((item) => (
                      <div key={item.id} style={{ marginBottom: "15px", borderBottom: "1px dashed #eee", paddingBottom: "10px" }}>
                        
                        {/* הוספת שם הקבוצה מעל שם המוצר */}
                        {order.group?.name && (
                          <div style={{ fontSize: "0.75rem", color: "#228be6", fontWeight: "bold", textTransform: "uppercase", marginBottom: "2px" }}>
                            {order.group.name}
                          </div>
                        )}

                        <div style={itemRowStyle}>
                          <Link href={`/products/${item.product?.id}`} style={productLinkStyle}>
                            {item.product?.name || `Product ${item.product?.id}`}
                          </Link>
                          <span style={{ fontSize: "0.9rem", color: "#666" }}>{item.quantity} units  </span>
                          <span style={{ fontSize: "0.9rem", color: "#666" }}> ₪{item.totalPrice}</span>
                        </div>
                        
                        {item.product?.description && (
                          <div style={descriptionStyle}>
                            {item.product.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.group && (
                    <div style={groupTagStyle}>
                      👥 Group: <strong>{order.group.name || order.group.id}</strong>
                    </div>
                  )}

                  <div style={footerStyle}>
                    <div style={totalPriceStyle}>Total: ₪{order.totalPrice}</div>
                    {order.status === "pending" && (
                      <button 
                        onClick={() => handleCancelOrder(order)} 
                        style={cancelButtonStyle}
                      >
                        Cancel Order
                      </button>
                    )}
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

// --- Styles ---
const bannerStyle = { background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", padding: "3rem 1.5rem", textAlign: "center" };
const bannerInnerStyle = { maxWidth: "600px", margin: "0 auto" };
const bannerTitleStyle = { fontSize: "2.5rem", fontWeight: "900", color: "#fff", marginBottom: "0.5rem" };
const bannerSubStyle = { color: "rgba(255,255,255,0.65)", marginBottom: "1.5rem" };
const searchWrapStyle = { position: "relative", maxWidth: "440px", margin: "0 auto" };
const searchIconStyle = { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem" };
const searchInputStyle = { width: "100%", padding: "0.8rem 1rem 0.8rem 2.8rem", borderRadius: "10px", border: "none", fontSize: "0.95rem", outline: "none", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" };
const pageWrapperStyle = { minHeight: "100vh", backgroundColor: "#f8f9fa", direction: "ltr" };
const mainContentStyle = { padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" };
const ordersGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", width: "100%" };
const orderCardStyle = { backgroundColor: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "380px" };
const orderHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" };
const orderNumberStyle = { fontSize: "1.2rem", fontWeight: "800", color: "#111" };
const dateStyle = { fontSize: "0.9rem", color: "#888", marginTop: "4px" };
const statusBadgeStyle = { padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", letterSpacing: "0.5px" };
const itemsSectionStyle = { marginBottom: "15px" };
const itemRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" };
const productLinkStyle = { color: "#228be6", textDecoration: "none", fontWeight: "600", fontSize: "1rem" };

const descriptionStyle = { 
  fontSize: "0.85rem", 
  color: "#777", 
  fontStyle: "italic", 
  lineHeight: "1.3",
  marginTop: "2px"
};

const groupTagStyle = { backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "15px", color: "#555" };
const footerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "15px", borderTop: "1px solid #eee", marginTop: "auto" };
const totalPriceStyle = { fontSize: "1.3rem", fontWeight: "800", color: "#111" };
const cancelButtonStyle = { backgroundColor: "#fff", color: "#fa5252", border: "1px solid #fa5252", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" };
const emptyStateStyle = { textAlign: "center", padding: "50px" };
const shopLinkStyle = { color: "#228be6", fontWeight: "bold", textDecoration: "underline" };
const errorCardStyle = { padding: "15px", backgroundColor: "#fff5f5", color: "#c92a2a", borderRadius: "8px" };