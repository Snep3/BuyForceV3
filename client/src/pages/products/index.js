import { useEffect, useState } from "react";
import { http } from "../../config/http";
import { useRouter } from "next/router";
import CountdownTimer from "../../components/CountDownTimer";

function normalizeImageUrl(url) {
  const u = (url || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

export default function ProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [imgErrors, setImgErrors] = useState({});
  const [modal, setModal] = useState(null); // null | { product, group, loading, empty, isJoined }

  async function handleCardClick(product) {
    setModal({ product, group: null, loading: true, empty: false, isJoined: false });
    try {
      const token = localStorage.getItem("token");
      const [groupRes, myGroupsRes] = await Promise.all([
        http.get(`/api/groups/by-product/${product.id}`),
        token ? http.get("/api/groups/my") : Promise.resolve({ data: [] }),
      ]);
      if (groupRes.data) {
        const myIds = new Set((myGroupsRes.data || []).map((g) => String(g.id)));
        setModal({ product, group: groupRes.data, loading: false, empty: false, isJoined: myIds.has(String(groupRes.data.id)) });
      } else {
        setModal({ product, group: null, loading: false, empty: true, isJoined: false });
      }
    } catch {
      setModal({ product, group: null, loading: false, empty: true, isJoined: false });
    }
  }

  function closeModal() { setModal(null); }

  async function handleJoin(groupId) {
    if (!localStorage.getItem("token")) return router.push("/login");
    try {
      await http.post(`/api/groups/${groupId}/join`);
      const res = await http.get(`/api/groups/by-product/${modal.product.id}`);
      setModal((prev) => ({ ...prev, group: res.data, isJoined: true }));
    } catch (err) {
      alert(err?.response?.data?.message || "Error joining group");
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await http.get("/api/products");
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = items.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Page header */}
      <div style={pageHeaderStyle}>
        <div style={pageHeaderInnerStyle}>
          <h1 style={pageTitleStyle}>All Products</h1>
          <p style={pageSubStyle}>Discover products available for group buying</p>
          <div style={searchWrapStyle}>
            <span style={searchIconStyle}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or categories..."
              style={searchInputStyle}
            />
          </div>
        </div>
      </div>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle} />
            <span style={{ color: "#868e96" }}>Loading products...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: "3rem" }}>🔍</div>
            <h3 style={{ margin: "1rem 0 0.5rem" }}>
              {search ? "No products match your search" : "No products yet"}
            </h3>
            {search && (
              <button onClick={() => setSearch("")} style={clearSearchBtn}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p style={{ color: "#868e96", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div style={gridStyle}>
              {filtered.map((p) => {
                const src = p.imageUrl ? normalizeImageUrl(p.imageUrl) : "";
                const err = imgErrors[p.id];

                return (
                  <div
                    key={p.id}
                    style={cardStyle}
                    onClick={() => handleCardClick(p)}
                  >
                    <div style={imgWrapStyle}>
                      {src && !err ? (
                        <img
                          src={src}
                          alt={p.name}
                          style={imgStyle}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setImgErrors((prev) => ({ ...prev, [p.id]: true }))
                          }
                        />
                      ) : (
                        <div style={noImgStyle}>
                          <span style={{ fontSize: "2rem" }}>📦</span>
                          <span style={{ fontSize: "0.8rem", color: "#adb5bd" }}>No image</span>
                        </div>
                      )}
                      {p.category && (
                        <span style={categoryBadgeStyle}>{p.category}</span>
                      )}
                    </div>

                    <div style={cardBodyStyle}>
                      <h3 style={cardNameStyle}>{p.name}</h3>
                      {p.description && (
                        <p style={cardDescStyle}>
                          {p.description.length > 70
                            ? p.description.slice(0, 70) + "…"
                            : p.description}
                        </p>
                      )}
                      <div style={cardFooterStyle}>
                        <span style={priceStyle}>₪{p.price}</span>
                        <span style={stockStyle}>
                          {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Group Modal */}
      {modal && (
        <div style={overlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button style={closeBtnStyle} onClick={closeModal}>✕</button>

            {modal.loading ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={modalSpinnerStyle} />
                <p style={{ color: "#868e96", marginTop: "1rem" }}>Looking for available groups...</p>
              </div>
            ) : modal.empty ? (
              <div style={noGroupStyle}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🛒</div>
                <h3 style={{ margin: "0 0 0.5rem", color: "#111", fontWeight: "800" }}>No groups available</h3>
                <p style={{ color: "#868e96", margin: 0, fontSize: "0.95rem" }}>
                  There are no currently available groups for <strong>{modal.product.name}</strong>.<br />Check back soon or explore other deals.
                </p>
              </div>
            ) : (() => {
              const g = modal.group;
              const progress = g.progress ?? 0;
              const goalReached = progress >= 100;
              const isExpired = g.deadline && new Date(g.deadline) <= new Date();
              const imageUrl = modal.product.imageUrl ? normalizeImageUrl(modal.product.imageUrl) : "https://via.placeholder.com/400x250?text=No+Image";
              const disc = Number(g.discountPercent ?? 0);
              const orig = Number(modal.product.price ?? 0);
              const final = g.discountedPrice != null ? Number(g.discountedPrice) : orig;
              return (
                <div>
                  <div style={modalImgWrapStyle}>
                    <img src={imageUrl} alt={modal.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {isExpired
                      ? <span style={modalExpiredBadge}>Expired</span>
                      : <span style={modalActiveBadge}>Active</span>
                    }
                  </div>
                  <div style={{ padding: "1.5rem" }}>
                    <h2 style={{ margin: "0 0 0.25rem", fontWeight: "800", fontSize: "1.3rem" }}>{g.name}</h2>
                    <p style={{ margin: "0 0 0.75rem", color: "#868e96", fontSize: "0.9rem" }}>{modal.product.name}</p>

                    {disc > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                        <span style={{ fontSize: "1.4rem", fontWeight: "800", color: "#228be6" }}>₪{final}</span>
                        <span style={{ color: "#adb5bd", textDecoration: "line-through" }}>₪{orig}</span>
                        <span style={{ background: "#ebfbee", color: "#2f9e44", fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>{disc}% OFF</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#228be6", marginBottom: "1rem" }}>₪{orig}</div>
                    )}

                    {g.description && (
                      <p style={{ fontSize: "0.9rem", color: "#555", lineHeight: 1.5, marginBottom: "1rem" }}>{g.description}</p>
                    )}

                    {goalReached ? (
                      <div style={modalGoalReachedStyle}>🎉 Goal Reached! {g.currentParticipants} members joined</div>
                    ) : (
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                          <span style={{ color: "#495057" }}>{g.currentParticipants} / {g.minParticipants} members</span>
                          <span style={{ color: "#228be6" }}>{progress}%</span>
                        </div>
                        <div style={{ background: "#e9ecef", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ background: "linear-gradient(90deg,#228be6,#15aabf)", height: "100%", width: `${Math.min(progress, 100)}%`, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "0.85rem", fontWeight: "600", color: "#868e96", marginBottom: "1.25rem" }}>
                      Ends in: <CountdownTimer deadline={g.deadline} />
                    </div>

                    {modal.isJoined && <div style={alreadyJoinedStyle}>✓ You've already joined this group</div>}
                    <button
                      disabled={isExpired || modal.isJoined}
                      onClick={() => !isExpired && !modal.isJoined && handleJoin(g.id)}
                      style={{
                        width: "100%", padding: "12px",
                        background: isExpired ? "#adb5bd" : modal.isJoined ? "#ebfbee" : "#228be6",
                        color: isExpired ? "#fff" : modal.isJoined ? "#2f9e44" : "#fff",
                        border: modal.isJoined ? "2px solid #b2f2bb" : "none",
                        borderRadius: "10px", fontWeight: "800", fontSize: "1rem",
                        cursor: isExpired || modal.isJoined ? "default" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {isExpired ? "Deal Ended" : modal.isJoined ? "Already Joined" : "Join Group"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

const pageHeaderStyle = {
  background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  padding: "3rem 1.5rem",
  textAlign: "center",
};
const pageHeaderInnerStyle = { maxWidth: "600px", margin: "0 auto" };
const pageTitleStyle = { fontSize: "2.5rem", fontWeight: "900", color: "#fff", marginBottom: "0.5rem" };
const pageSubStyle = { color: "rgba(255,255,255,0.65)", marginBottom: "1.5rem" };
const searchWrapStyle = {
  position: "relative",
  maxWidth: "440px",
  margin: "0 auto",
};
const searchIconStyle = {
  position: "absolute",
  left: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "1rem",
};
const searchInputStyle = {
  width: "100%",
  padding: "0.8rem 1rem 0.8rem 2.8rem",
  borderRadius: "10px",
  border: "none",
  fontSize: "0.95rem",
  outline: "none",
  fontFamily: "inherit",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};
const loadingStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  padding: "4rem",
};
const spinnerStyle = {
  width: "36px",
  height: "36px",
  border: "3px solid #e9ecef",
  borderTop: "3px solid #228be6",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};
const emptyStyle = {
  textAlign: "center",
  padding: "4rem",
  color: "#495057",
};
const clearSearchBtn = {
  marginTop: "1rem",
  padding: "8px 20px",
  background: "#228be6",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: "600",
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: "1.25rem",
};
const cardStyle = {
  background: "#fff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  border: "1px solid #f0f0f0",
  transition: "transform 0.2s, box-shadow 0.2s",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  height: "100%",
};
const imgWrapStyle = {
  height: "180px",
  position: "relative",
  overflow: "hidden",
  background: "#f1f3f5",
};
const imgStyle = { width: "100%", height: "100%", objectFit: "contain", padding: "8px" };
const noImgStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
};
const categoryBadgeStyle = {
  position: "absolute",
  bottom: "10px",
  left: "10px",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "0.72rem",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};
const cardBodyStyle = {
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  flexGrow: 1,
};
const cardNameStyle = { fontSize: "1rem", fontWeight: "700", color: "#111", margin: 0, lineHeight: 1.3 };
const cardDescStyle = { fontSize: "0.82rem", color: "#868e96", lineHeight: 1.4, margin: 0 };
const cardFooterStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "0.5rem" };
const priceStyle = { fontSize: "1.1rem", fontWeight: "800", color: "#228be6" };
const stockStyle = { fontSize: "0.78rem", color: "#868e96", fontWeight: "500" };

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: "1rem",
};
const modalStyle = {
  background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "480px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden",
  position: "relative", transform: "scale(1.03)",
};
const closeBtnStyle = {
  position: "absolute", top: "12px", right: "12px", zIndex: 10,
  width: "32px", height: "32px", border: "none", borderRadius: "50%",
  background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: "0.9rem",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const modalImgWrapStyle = { width: "100%", height: "220px", overflow: "hidden", position: "relative", background: "#f1f3f5" };
const modalActiveBadge = { position: "absolute", top: "12px", right: "12px", background: "#20c997", color: "#fff", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" };
const modalExpiredBadge = { ...modalActiveBadge, background: "#868e96" };
const modalGoalReachedStyle = { background: "#ebfbee", color: "#2f9e44", border: "1px solid #b2f2bb", borderRadius: "10px", padding: "10px 14px", fontWeight: "700", fontSize: "0.9rem", textAlign: "center", marginBottom: "1rem" };
const noGroupStyle = { padding: "2.5rem 2rem", textAlign: "center" };
const alreadyJoinedStyle = { background: "#ebfbee", color: "#2f9e44", border: "1px solid #b2f2bb", borderRadius: "10px", padding: "8px 14px", fontWeight: "700", fontSize: "0.85rem", textAlign: "center", marginBottom: "0.75rem" };
const modalSpinnerStyle = { width: "36px", height: "36px", border: "3px solid #e9ecef", borderTop: "3px solid #228be6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" };
