import { useEffect, useState } from "react";
import { http } from "../config/http";
import { useRouter } from "next/router";
import CountdownTimer from "../components/CountDownTimer";

export default function HomePage() {
  const [groups, setGroups] = useState([]);
  const [myGroupIds, setMyGroupIds] = useState(new Set());
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      await syncData();
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  }

  async function syncData() {
    const token = localStorage.getItem("token");
    const resGroups = await http.get("/api/groups");

    if (token) {
      const [resMyGroups, resWish] = await Promise.all([
        http.get("/api/groups/my"),
        http.get("/api/wishlist"),
      ]);
      setMyGroupIds(new Set(resMyGroups.data.map((g) => String(g.id))));
      const favIds = new Set();
      resWish.data.forEach((item) => {
        if (item.productId) favIds.add(String(item.productId));
        if (item.groupId) favIds.add(String(item.groupId));
        if (item.product?.id) favIds.add(String(item.product.id));
      });
      setWishlistIds(favIds);
    }

    const activeGroups = resGroups.data.filter(
      (g) => g.isActive && (!g.deadline || new Date(g.deadline) > new Date())
    );
    setGroups(activeGroups);
  }

  async function handleGroupVote(groupId, shouldAdd) {
    if (!groupId) return;
    if (!localStorage.getItem("token")) return router.push("/login");
    const gIdStr = String(groupId);
    setWishlistIds((prev) => {
      const s = new Set(prev);
      shouldAdd ? s.add(gIdStr) : s.delete(gIdStr);
      return s;
    });
    try {
      shouldAdd
        ? await http.post("/api/wishlist/add", { groupId: gIdStr })
        : await http.delete(`/api/wishlist/remove/${gIdStr}`);
    } catch {
      syncData();
    }
  }

  async function handleVote(productId, shouldAdd) {
    if (!productId || productId === "null") return;
    if (!localStorage.getItem("token")) return router.push("/login");
    const pIdStr = String(productId);
    setWishlistIds((prev) => {
      const s = new Set(prev);
      shouldAdd ? s.add(pIdStr) : s.delete(pIdStr);
      return s;
    });
    try {
      shouldAdd
        ? await http.post("/api/wishlist/add", { productId: pIdStr })
        : await http.delete(`/api/wishlist/remove/${pIdStr}`);
    } catch {
      syncData();
    }
  }

  async function handleJoin(groupId) {
    if (!localStorage.getItem("token")) return router.push("/login");
    const gIdStr = String(groupId);
    setMyGroupIds((prev) => new Set(prev).add(gIdStr));
    setGroups((prev) =>
      prev.map((g) => {
        if (String(g.id) !== gIdStr) return g;
        const n = g.currentParticipants + 1;
        return { ...g, currentParticipants: n, progress: Math.min(Math.round((n / g.minParticipants) * 100), 100) };
      })
    );
    try {
      await http.post(`/api/groups/${groupId}/join`);
      syncData();
    } catch (err) {
      alert(err.response?.data?.message || "Error joining group");
      syncData();
    }
  }

  async function handleLeave(groupId) {
    const gIdStr = String(groupId);
    setMyGroupIds((prev) => {
      const s = new Set(prev);
      s.delete(gIdStr);
      return s;
    });
    setGroups((prev) =>
      prev.map((g) => {
        if (String(g.id) !== gIdStr) return g;
        const n = Math.max(g.currentParticipants - 1, 0);
        return { ...g, currentParticipants: n, progress: Math.min(Math.round((n / g.minParticipants) * 100), 100) };
      })
    );
    try {
      await http.delete(`/api/groups/${groupId}/join`);
      syncData();
    } catch (err) {
      alert(err.response?.data?.message || "Error leaving group");
      syncData();
    }
  }

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.product?.name?.toLowerCase().includes(q) ||
      g.product?.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Banner */}
      <div style={bannerStyle}>
        <div style={bannerInnerStyle}>
          <h1 style={bannerTitleStyle}>Active Group Deals</h1>
          <p style={bannerSubStyle}>Join a group and save together</p>
          <div style={searchWrapStyle}>
            <span style={searchIconStyle}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups or products..."
              style={searchInputStyle}
            />
          </div>
        </div>
      </div>

      {/* Groups grid */}
      <main style={{ padding: "3rem 1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#111" }}>
            {search ? `Results for "${search}"` : "All Deals"}
          </h2>
          <span style={{ color: "#868e96", fontSize: "0.9rem" }}>{filtered.length} deals available</span>
        </div>

        {loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle} />
            <span>Loading deals...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: "3rem" }}>{search ? "🔍" : "📦"}</div>
            <h3 style={{ margin: "1rem 0 0.5rem" }}>{search ? "No deals match your search" : "No active deals yet"}</h3>
            {search && <button onClick={() => setSearch("")} style={{ marginTop: "0.5rem", padding: "8px 20px", background: "#228be6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>Clear search</button>}
          </div>
        ) : (
          <div style={gridStyle}>
            {filtered.map((group) => {
              const isJoined = myGroupIds.has(String(group.id));
              const isLiked = wishlistIds.has(String(group.id));
              const prodId = group.product?.id || group.productId;
              const imageUrl = group.product?.imageUrl || "https://via.placeholder.com/400x250?text=No+Image";
              const progress = group.progress ?? 0;

              return (
                <div key={group.id} style={cardStyle}>
                  {/* Image */}
                  <div style={imgWrapStyle}>
                    <img src={imageUrl} alt={group.name} style={imgStyle} />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGroupVote(group.id, !isLiked); }}
                      style={heartBtnStyle(isLiked)}
                      title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {isLiked ? "♥" : "♡"}
                    </button>
                    <span style={activeBadgeStyle}>Active</span>
                    {isJoined && <span style={joinedBadgeStyle}>Joined</span>}
                  </div>

                  {/* Content */}
                  <div style={cardBodyStyle}>
                    <div
                      onClick={() => prodId && router.push(`/products/${prodId}`)}
                      style={{ cursor: prodId ? "pointer" : "default" }}
                    >
                      <h3 style={cardTitleStyle}>{group.name}</h3>
                      {group.product?.name && (
                        <p style={cardProductStyle}>{group.product.name}</p>
                      )}
                      {group.product?.price != null && (() => {
                        const disc = Number(group.discountPercent ?? 0);
                        const orig = Number(group.product.price);
                        const final = group.discountedPrice != null ? Number(group.discountedPrice) : orig;
                        return disc > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "#228be6" }}>₪{final}</span>
                            <span style={{ fontSize: "0.95rem", color: "#adb5bd", textDecoration: "line-through" }}>₪{orig}</span>
                            <span style={{ background: "#ebfbee", color: "#2f9e44", fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>{disc}% OFF</span>
                          </div>
                        ) : (
                          <div style={cardPriceStyle}>₪{orig}</div>
                        );
                      })()}
                    </div>

                    {group.description && (
                      <p style={cardDescStyle}>{group.description}</p>
                    )}

                    {/* Progress */}
                    <div style={{ marginTop: "auto" }}>
                      <div style={progressLabelStyle}>
                        <span style={{ color: "#495057" }}>
                          {group.currentParticipants} / {group.minParticipants} members
                        </span>
                        <span style={{ color: "#228be6", fontWeight: "700" }}>{progress}%</span>
                      </div>
                      <div style={progressBgStyle}>
                        <div style={{ ...progressFillStyle, width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>

                    <div style={timerStyle}>
                      <span style={{ color: "#868e96" }}>Ends in:</span>
                      <CountdownTimer deadline={group.deadline} />
                    </div>

                    {isJoined ? (
                      <button onClick={() => handleLeave(group.id)} style={leaveBtn}>
                        Leave Group
                      </button>
                    ) : (
                      <button onClick={() => handleJoin(group.id)} style={joinBtn}>
                        Join Group
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
const bannerStyle = {
  background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  padding: "3rem 1.5rem",
  textAlign: "center",
};
const bannerInnerStyle = { maxWidth: "600px", margin: "0 auto" };
const bannerTitleStyle = { fontSize: "2.5rem", fontWeight: "900", color: "#fff", marginBottom: "0.5rem" };
const bannerSubStyle = { color: "rgba(255,255,255,0.65)", marginBottom: "1.5rem" };
const searchWrapStyle = { position: "relative", maxWidth: "440px", margin: "0 auto" };
const searchIconStyle = { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem" };
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
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: "1.5rem",
};
const loadingStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  padding: "4rem",
  color: "#868e96",
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
const cardStyle = {
  background: "#fff",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
  border: "1px solid #f0f0f0",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.2s, box-shadow 0.2s",
};
const imgWrapStyle = {
  width: "100%",
  height: "200px",
  overflow: "hidden",
  position: "relative",
  backgroundColor: "#f1f3f5",
};
const imgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const heartBtnStyle = (liked) => ({
  position: "absolute",
  top: "12px",
  left: "12px",
  width: "36px",
  height: "36px",
  background: liked ? "#fa5252" : "rgba(255,255,255,0.9)",
  color: liked ? "#fff" : "#adb5bd",
  border: "none",
  borderRadius: "50%",
  fontSize: "1.1rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  transition: "all 0.2s",
  zIndex: 10,
});
const activeBadgeStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "#20c997",
  color: "#fff",
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "700",
};
const joinedBadgeStyle = {
  position: "absolute",
  bottom: "12px",
  right: "12px",
  background: "#228be6",
  color: "#fff",
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "700",
};
const cardBodyStyle = {
  padding: "1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  flexGrow: 1,
};
const cardTitleStyle = { fontSize: "1.1rem", fontWeight: "800", color: "#111", margin: 0, lineHeight: 1.3 };
const cardProductStyle = { fontSize: "0.85rem", color: "#868e96", margin: "2px 0 0" };
const cardPriceStyle = { fontSize: "1.3rem", fontWeight: "800", color: "#228be6" };
const cardDescStyle = { fontSize: "0.9rem", color: "#666", lineHeight: 1.5, margin: 0 };
const progressLabelStyle = { display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: "600", marginBottom: "6px" };
const progressBgStyle = { background: "#e9ecef", height: "8px", borderRadius: "4px", overflow: "hidden" };
const progressFillStyle = { background: "linear-gradient(90deg, #228be6, #15aabf)", height: "100%", transition: "width 0.4s ease" };
const timerStyle = { display: "flex", gap: "6px", alignItems: "center", fontSize: "0.85rem", fontWeight: "600" };
const joinBtn = {
  width: "100%",
  padding: "11px",
  background: "#228be6",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "800",
  fontSize: "0.95rem",
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.2s",
};
const leaveBtn = {
  width: "100%",
  padding: "11px",
  background: "#fff",
  color: "#fa5252",
  border: "2px solid #fa5252",
  borderRadius: "10px",
  fontWeight: "800",
  fontSize: "0.95rem",
  cursor: "pointer",
  fontFamily: "inherit",
};
