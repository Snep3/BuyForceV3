import { useEffect, useState } from "react";
import { http } from "../config/http";
import { useRouter } from "next/router";

export default function ProductComments({ productId }) {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        setLoadingList(true);
        setError("");
        const res = await http.get(`/api/products/${productId}/comments`);
        setComments(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError("Failed to load comments");
      } finally {
        setLoadingList(false);
      }
    })();
  }, [productId]);

  async function handleAddComment(e) {
    e.preventDefault();
    if (!content.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    setLoadingAdd(true);
    setError("");
    try {
      const res = await http.post(`/api/products/${productId}/comments`, {
        content: content.trim(),
      });
      setComments((prev) => [res.data, ...prev]);
      setContent("");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to post comment";
      setError(Array.isArray(msg) ? msg.join(" | ") : String(msg));
    } finally {
      setLoadingAdd(false);
    }
  }

  function getUserLabel(comment) {
    const u = comment.user;
    if (!u) return "Anonymous";
    return u.fullName || u.username || u.email || "User";
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch {
      return "";
    }
  }

  return (
    <section>
      <h2 style={sectionTitleStyle}>
        Reviews &amp; Comments
        {comments.length > 0 && (
          <span style={countStyle}>{comments.length}</span>
        )}
      </h2>

      {/* Add comment form */}
      <form onSubmit={handleAddComment} style={formStyle}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={3}
          style={textareaStyle}
        />
        {error && <div style={errorStyle}>{error}</div>}
        <button type="submit" disabled={loadingAdd || !content.trim()} style={submitBtnStyle}>
          {loadingAdd ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* Comments list */}
      {loadingList ? (
        <div style={loadingStyle}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={emptyStyle}>
          <span style={{ fontSize: "2rem" }}>💬</span>
          <p>No comments yet. Be the first to review!</p>
        </div>
      ) : (
        <div style={listStyle}>
          {comments.map((c) => (
            <div key={c.id} style={commentStyle}>
              <div style={commentHeaderStyle}>
                <div style={avatarStyle}>
                  {getUserLabel(c).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={usernameStyle}>{getUserLabel(c)}</div>
                  <div style={dateStyle}>{formatDate(c.createdAt)}</div>
                </div>
              </div>
              <p style={commentTextStyle}>{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const sectionTitleStyle = {
  fontSize: "1.4rem",
  fontWeight: "800",
  color: "#111",
  marginBottom: "1.5rem",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};
const countStyle = {
  background: "#e7f5ff",
  color: "#228be6",
  fontSize: "0.85rem",
  fontWeight: "700",
  padding: "2px 10px",
  borderRadius: "20px",
};
const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  marginBottom: "2rem",
  background: "#f8f9fa",
  padding: "1.25rem",
  borderRadius: "12px",
  border: "1px solid #f0f0f0",
};
const textareaStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border: "1.5px solid #dee2e6",
  fontSize: "0.95rem",
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  lineHeight: 1.5,
  transition: "border-color 0.2s",
};
const errorStyle = {
  background: "#fff5f5",
  color: "#c92a2a",
  border: "1px solid #ffa8a8",
  borderRadius: "8px",
  padding: "0.6rem 0.9rem",
  fontSize: "0.85rem",
};
const submitBtnStyle = {
  alignSelf: "flex-end",
  padding: "9px 22px",
  background: "#228be6",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "700",
  fontSize: "0.9rem",
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.2s, opacity 0.2s",
};
const loadingStyle = { textAlign: "center", color: "#868e96", padding: "2rem" };
const emptyStyle = {
  textAlign: "center",
  color: "#868e96",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.5rem",
};
const listStyle = { display: "flex", flexDirection: "column", gap: "1rem" };
const commentStyle = {
  background: "#f8f9fa",
  borderRadius: "12px",
  padding: "1rem 1.25rem",
  border: "1px solid #f0f0f0",
};
const commentHeaderStyle = { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" };
const avatarStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #228be6, #15aabf)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "0.9rem",
  flexShrink: 0,
};
const usernameStyle = { fontWeight: "700", fontSize: "0.9rem", color: "#212529" };
const dateStyle = { fontSize: "0.78rem", color: "#adb5bd" };
const commentTextStyle = { fontSize: "0.95rem", color: "#495057", lineHeight: 1.6, margin: 0 };
