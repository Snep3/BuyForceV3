import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { http } from "../config/http";
import CountdownTimer from "../components/CountDownTimer";

export default function MyGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveLoadingId, setLeaveLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.replace("/login"); return; }
    fetchMyGroups();
  }, [router]);

  async function fetchMyGroups() {
    try {
      setLoading(true);
      const res = await http.get("/api/groups/my");
      setGroups(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Error loading your groups");
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave(groupId) {
    try {
      setLeaveLoadingId(groupId);
      await http.delete(`/api/groups/${groupId}/join`);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      alert(err?.response?.data?.message || "Error leaving group");
    } finally {
      setLeaveLoadingId(null);
    }
  }

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.product?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6", direction: "ltr" }}>
      {/* Banner */}
      <div style={bannerStyle}>
        <div style={bannerInnerStyle}>
          <h1 style={bannerTitleStyle}>My Groups</h1>
          <p style={bannerSubStyle}>Manage the groups you have joined</p>
          <div style={searchWrapStyle}>
            <span style={searchIconStyle}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your groups..."
              style={searchInputStyle}
            />
          </div>
        </div>
      </div>

      <main style={{ padding: "3rem 1rem", maxWidth: "1400px", margin: "0 auto" }}>
        {error && (
          <div style={{ background: "#fff5f5", border: "1px solid #ffa8a8", color: "#fa5252", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", textAlign: "center" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", fontSize: "1.5rem" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#666" }}>
            <div style={{ fontSize: "3rem" }}>{search ? "🔍" : "📦"}</div>
            <h3 style={{ margin: "1rem 0 0.5rem" }}>
              {search ? "No groups match your search" : "You haven't joined any groups yet."}
            </h3>
            {search && (
              <button onClick={() => setSearch("")} style={clearBtn}>Clear search</button>
            )}
          </div>
        ) : (
          <>
            <p style={{ color: "#868e96", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              {filtered.length} group{filtered.length !== 1 ? "s" : ""}
            </p>
            <div style={gridStyle}>
              {filtered.map((group) => {
                const progress = group.progress ?? 0;
                const isFull = progress >= 100 || group.isCompleted;
                const imageUrl = group.product?.imageUrl || "https://via.placeholder.com/400x250?text=No+Image";

                return (
                  <div key={group.id} style={cardStyle}>
                    <div style={imageContainerStyle}>
                      <img src={imageUrl} alt={group.name} style={imageStyle} />
                    </div>

                    <div style={isFull ? fullBadgeStyle : activeBadgeStyle}>
                      {isFull ? "Completed" : "Active"}
                    </div>

                    <div style={contentStyle}>
                      <div>
                        <h3 style={titleStyle}>{group.name}</h3>
                        <div style={{ color: "#228be6", fontWeight: "700", fontSize: "1.1rem", marginTop: "5px" }}>
                          ₪{group.product?.price || 0}
                        </div>
                      </div>

                      {group.description && (
                        <p style={{ fontSize: "1rem", color: "#666", lineHeight: "1.5", margin: 0 }}>{group.description}</p>
                      )}

                      <div style={{ marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: "bold", marginBottom: "8px" }}>
                          <span>Progress: {group.currentParticipants} / {group.minParticipants}</span>
                          <span>{progress}%</span>
                        </div>
                        <div style={{ backgroundColor: "#e9ecef", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                          <div style={{ backgroundColor: isFull ? "#20c997" : "#228be6", height: "100%", width: `${Math.min(progress, 100)}%`, transition: "width 0.6s ease" }} />
                        </div>
                      </div>

                      <div style={{ fontSize: "0.9rem", color: "#555", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                        ⏰ Ends in: <CountdownTimer deadline={group.deadline} />
                      </div>

                      {group.joinedAt && (
                        <div style={{ fontSize: "0.8rem", color: "#999" }}>
                          Joined: {new Date(group.joinedAt).toLocaleDateString("en-GB")}
                        </div>
                      )}

                      <button
                        onClick={() => handleLeave(group.id)}
                        disabled={isFull || leaveLoadingId === group.id}
                        style={{
                          width: "100%", padding: "12px",
                          backgroundColor: isFull ? "#f1f3f5" : "#fff",
                          color: isFull ? "#adb5bd" : "#ff4d4f",
                          border: `2px solid ${isFull ? "#dee2e6" : "#ff4d4f"}`,
                          borderRadius: "8px", cursor: isFull ? "default" : "pointer",
                          fontWeight: "800", fontSize: "0.9rem", textTransform: "uppercase", marginTop: "10px",
                        }}
                      >
                        {leaveLoadingId === group.id ? "Leaving..." : isFull ? "Completed" : "Leave Group"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const bannerStyle = { background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", padding: "3rem 1.5rem", textAlign: "center" };
const bannerInnerStyle = { maxWidth: "600px", margin: "0 auto" };
const bannerTitleStyle = { fontSize: "2.5rem", fontWeight: "900", color: "#fff", marginBottom: "0.5rem" };
const bannerSubStyle = { color: "rgba(255,255,255,0.65)", marginBottom: "1.5rem" };
const searchWrapStyle = { position: "relative", maxWidth: "440px", margin: "0 auto" };
const searchIconStyle = { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem" };
const searchInputStyle = { width: "100%", padding: "0.8rem 1rem 0.8rem 2.8rem", borderRadius: "10px", border: "none", fontSize: "0.95rem", outline: "none", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" };
const clearBtn = { marginTop: "1rem", padding: "8px 20px", background: "#228be6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem" };
const cardStyle = { backgroundColor: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0", display: "flex", flexDirection: "column", position: "relative" };
const imageContainerStyle = { width: "100%", height: "220px", overflow: "hidden", backgroundColor: "#eee" };
const imageStyle = { width: "100%", height: "100%", objectFit: "contain", padding: "8px" };
const activeBadgeStyle = { position: "absolute", top: "15px", right: "15px", backgroundColor: "#20c997", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" };
const fullBadgeStyle = { ...activeBadgeStyle, backgroundColor: "#f08c00" };
const contentStyle = { padding: "1.5rem", flexGrow: 1, display: "flex", flexDirection: "column", gap: "1rem" };
const titleStyle = { margin: 0, fontSize: "1.4rem", fontWeight: "800", color: "#111" };
