import Link from "next/link";
import { useEffect, useState } from "react";
import { http } from "../../config/http";

function normalizeImageUrl(url) {
  const u = (url || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [imgErrors, setImgErrors] = useState({});

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
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div style={cardStyle}>
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
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
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
