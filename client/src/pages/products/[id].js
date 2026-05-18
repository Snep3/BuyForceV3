import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { http } from "../../config/http";
import ProductComments from "../../components/ProductComments";

function normalizeImageUrl(url) {
  const u = (url || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

export default function ProductDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setImgError(false);
        const res = await http.get(`/api/products/${id}`);
        setProduct(res.data);

        const token = localStorage.getItem("token");
        if (token) {
          const wishlistRes = await http.get("/api/wishlist");
          setIsFavorite(wishlistRes.data.some((item) => item.productId === id));
        }
      } catch (e) {
        console.error(e);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleVote(shouldBeFavorite) {
    if (!localStorage.getItem("token")) return router.push("/login");
    try {
      if (shouldBeFavorite && !isFavorite) {
        await http.post("/api/wishlist/add", { productId: id });
        setIsFavorite(true);
      } else if (!shouldBeFavorite && isFavorite) {
        await http.delete(`/api/wishlist/remove/${id}`);
        setIsFavorite(false);
      }
    } catch {
      alert("Failed to update wishlist");
    }
  }

  if (loading) {
    return (
      <div style={pageWrap}>
        <div style={loadingStyle}>
          <div style={spinnerStyle} />
          <span style={{ color: "#868e96" }}>Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={pageWrap}>
        <div style={notFoundStyle}>
          <div style={{ fontSize: "3rem" }}>😕</div>
          <h2>Product not found</h2>
          <button onClick={() => router.push("/products")} style={backBtnStyle}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const src = product.imageUrl ? normalizeImageUrl(product.imageUrl) : "";
  const activeGroup = product.groups?.find((g) => g.isActive === true);

  return (
    <div style={pageWrap}>
      <main style={mainStyle}>
        <button onClick={() => router.back()} style={backLinkStyle}>
          ← Back
        </button>

        <div style={productGridStyle}>
          {/* Image */}
          <div style={imgSectionStyle}>
            {src && !imgError ? (
              <img
                src={src}
                alt={product.name}
                style={mainImgStyle}
                onError={() => setImgError(true)}
              />
            ) : (
              <div style={noImgStyle}>
                <span style={{ fontSize: "4rem" }}>📦</span>
                <span style={{ color: "#adb5bd" }}>No image available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div style={detailsStyle}>
            {product.category && (
              <span style={catBadgeStyle}>{product.category}</span>
            )}
            <h1 style={titleStyle}>{product.name}</h1>
            <div style={priceStyle}>₪{product.price}</div>

            {/* Wishlist */}
            <div style={wishlistRowStyle}>
              <span style={{ fontSize: "0.9rem", color: "#495057", fontWeight: "500" }}>
                Add to wishlist:
              </span>
              <button
                onClick={() => handleVote(!isFavorite)}
                style={wishBtnStyle(isFavorite)}
              >
                {isFavorite ? "♥ Saved" : "♡ Save"}
              </button>
            </div>

            {/* Active group */}
            {activeGroup && (
              <div style={activeGroupStyle}>
                <span style={{ fontWeight: "700", color: "#228be6" }}>Group deal available!</span>
                <span
                  style={{ cursor: "pointer", textDecoration: "underline", color: "#228be6" }}
                  onClick={() => router.push("/")}
                >
                  {activeGroup.name}
                </span>
              </div>
            )}

            <div style={dividerStyle} />

            {product.description && (
              <p style={descStyle}>{product.description}</p>
            )}

            <div style={infoRowStyle}>
              <span style={{ color: "#495057" }}>Stock:</span>
              <span style={{ fontWeight: "700", color: product.stock > 0 ? "#20c997" : "#fa5252" }}>
                {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
              </span>
            </div>

            <button onClick={() => router.push("/")} style={viewGroupsBtn}>
              View Group Deals
            </button>
          </div>
        </div>

        {/* Comments */}
        <div style={commentsSectionStyle}>
          <ProductComments productId={id} />
        </div>
      </main>
    </div>
  );
}

const pageWrap = { minHeight: "100vh", background: "#f8f9fa" };
const mainStyle = { maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" };
const loadingStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "6rem", color: "#868e96" };
const spinnerStyle = { width: "36px", height: "36px", border: "3px solid #e9ecef", borderTop: "3px solid #228be6", borderRadius: "50%", animation: "spin 0.8s linear infinite" };
const notFoundStyle = { textAlign: "center", padding: "6rem", color: "#495057", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" };
const backLinkStyle = { background: "none", border: "none", color: "#228be6", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem", padding: "0", marginBottom: "1.5rem", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "4px" };
const backBtnStyle = { padding: "10px 20px", background: "#228be6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: "700" };
const productGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2.5rem", background: "#fff", padding: "2rem", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" };
const imgSectionStyle = { borderRadius: "14px", overflow: "hidden", background: "#f8f9fa", height: "380px", display: "flex", alignItems: "center", justifyContent: "center" };
const mainImgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const noImgStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "#adb5bd" };
const detailsStyle = { display: "flex", flexDirection: "column", gap: "1rem" };
const catBadgeStyle = { background: "#e7f5ff", color: "#228be6", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700", width: "fit-content", textTransform: "uppercase", letterSpacing: "0.5px" };
const titleStyle = { fontSize: "2rem", fontWeight: "900", color: "#111", margin: 0, lineHeight: 1.2 };
const priceStyle = { fontSize: "2rem", fontWeight: "800", color: "#228be6" };
const wishlistRowStyle = { display: "flex", alignItems: "center", gap: "1rem" };
const wishBtnStyle = (active) => ({
  padding: "8px 18px",
  background: active ? "#fa5252" : "#fff",
  color: active ? "#fff" : "#495057",
  border: `2px solid ${active ? "#fa5252" : "#dee2e6"}`,
  borderRadius: "8px",
  fontWeight: "700",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  transition: "all 0.2s",
});
const activeGroupStyle = { display: "flex", flexDirection: "column", gap: "4px", background: "#e7f5ff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #d0e7ff" };
const dividerStyle = { height: "1px", background: "#f1f3f5" };
const descStyle = { fontSize: "1rem", lineHeight: 1.7, color: "#495057", margin: 0 };
const infoRowStyle = { display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.95rem" };
const viewGroupsBtn = { padding: "13px", background: "#111", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer", fontSize: "0.95rem", fontFamily: "inherit", marginTop: "0.5rem" };
const commentsSectionStyle = { marginTop: "2.5rem", background: "#fff", borderRadius: "20px", padding: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" };
