import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { API_URL } from "../config/api";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    const token = localStorage.getItem("token");
    if (!token) return router.replace("/login");

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data || []);
    } catch (err) {
      setError("אירעה שגיאה בטעינת רשימת המעקב");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id, type) {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/api/wishlist/remove/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setItems(prev => prev.filter(item => 
        type === 'product' ? item.productId !== id : item.groupId !== id
      ));
    } catch (err) {
      alert("שגיאה בהסרה");
    }
  }

  const q = search.toLowerCase();
  const wishlistProducts = items.filter(item => (item.product || item.productId) && (
    !q || item.product?.name?.toLowerCase().includes(q) || item.product?.category?.toLowerCase().includes(q)
  ));
  const wishlistGroups = items.filter(item => (item.group || item.groupId) && (
    !q || item.group?.name?.toLowerCase().includes(q) || item.group?.product?.name?.toLowerCase().includes(q)
  ));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f6", direction: "ltr" }}>
      {/* Banner */}
      <div style={bannerStyle}>
        <div style={bannerInnerStyle}>
          <h1 style={bannerTitleStyle}>My Wishlist</h1>
          <p style={bannerSubStyle}>Your saved products and group deals</p>
          <div style={searchWrapStyle}>
            <span style={searchIconStyle}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your wishlist..."
              style={searchInputStyle}
            />
          </div>
        </div>
      </div>

      <main style={{ padding: "4rem 2rem", maxWidth: "1300px", margin: "0 auto" }}>

        {loading ? (
          <div style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "700" }}>LOADING WISHLIST...</div>
        ) : (
          <>
            {/* קבוצות רכישה */}
            <section style={{ marginBottom: "4rem" }}>
              <h2 style={sectionTitleStyle}>My Groups Wishlist</h2>
              {wishlistGroups.length === 0 ? <p style={emptyTextStyle}>No groups saved yet.</p> : (
                <div style={gridStyle}>
                  {wishlistGroups.map(item => (
                    <WishlistCard 
                      key={item.id} 
                      item={item} 
                      title={item.group?.name || "Group"} 
                      price={item.group?.product?.price} 
                      link={`/`} 
                      onRemove={() => handleRemove(item.groupId, 'group')}
                      image={item.group?.product?.imageUrl}
                      isGroup={true}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* מוצרים בודדים */}
            <section>
              <h2 style={sectionTitleStyle}>My Wishlist Products</h2>
              {wishlistProducts.length === 0 ? <p style={emptyTextStyle}>No products saved yet.</p> : (
                <div style={gridStyle}>
                  {wishlistProducts.map(item => (
                    <WishlistCard 
                      key={item.id} 
                      item={item}
                      title={item.product?.name || "Product"} 
                      price={item.product?.price}
                      link={`/products/${item.productId}`} 
                      onRemove={() => handleRemove(item.productId, 'product')}
                      image={item.product?.imageUrl}
                      isGroup={false}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function WishlistCard({ title, price, link, onRemove, image, isGroup, item }) {
  const productInfo = isGroup ? item?.group?.product : item?.product;
  const description = isGroup ? item?.group?.description : productInfo?.description;

  // לוגיקה חדשה: בדיקה אם קיימת קבוצה פעילה עבור המוצר
  const activeGroup = !isGroup && productInfo?.groups?.find(g => g.status === 'active' || g.isActive);

  return (
    <div 
      style={cardStyle}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-8px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <Link href={link} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={imageContainerStyle}>
          <img src={image || "https://via.placeholder.com/400x250"} style={imageStyle} alt={title} />
          {isGroup && <div style={badgeStyle}>GROUP DEAL</div>}
        </div>
        
        <div style={cardContentStyle}>
          <h3 style={cardTitleStyle}>{title}</h3>
          
          {isGroup && productInfo?.name && (
            <p style={productSubNameStyle}>Product: {productInfo.name}</p>
          )}

          {price && <p style={priceStyle}>₪{price}</p>}

          {/* הבאדג' שהוספתי עבור קבוצה פעילה למוצר */}
          {activeGroup && (
            <div style={activeGroupBannerStyle}>
              In active group: <Link href={`/groups/${activeGroup.id}`} style={activeGroupLinkStyle}>{activeGroup.name}</Link>
            </div>
          )}

          {description && (
            <p style={descriptionStyle}>
              {description.length > 80 ? description.substring(0, 80) + "..." : description}
            </p>
          )}
        </div>
      </Link>

      <div style={buttonWrapperStyle}>
        <button 
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }} 
          style={centeredRemoveBtnStyle}
        >
          REMOVE
        </button>
      </div>
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
const sectionTitleStyle = { fontSize: "1.4rem", fontWeight: "900", color: "#000", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1.5rem", display: "block", borderBottom: "2px solid #000", paddingBottom: "8px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem" };
const cardStyle = { backgroundColor: "#fff", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", transition: "all 0.3s ease", border: "1px solid #eee", height: "100%" };
const imageContainerStyle = { width: "100%", height: "200px", position: "relative", overflow: "hidden" };
const imageStyle = { width: "100%", height: "100%", objectFit: "cover" };
const badgeStyle = { position: "absolute", top: "15px", right: "15px", backgroundColor: "#228be6", color: "#fff", padding: "5px 12px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "900", boxShadow: "0 4px 10px rgba(34, 139, 230, 0.3)" };

const cardContentStyle = { 
  padding: "1.5rem", 
  textAlign: "center", 
  display: "flex", 
  flexDirection: "column", 
  alignItems: "center", 
  flexGrow: 1 
};

const cardTitleStyle = { margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#111", lineHeight: "1.4" };
const productSubNameStyle = { margin: "4px 0", fontSize: "0.9rem", color: "#228be6", fontWeight: "700", textTransform: "uppercase" };
const priceStyle = { fontWeight: "900", color: "#228be6", fontSize: "1.3rem", margin: "10px 0" };
const descriptionStyle = { margin: "5px 0", fontSize: "0.85rem", color: "#666", lineHeight: "1.4", minHeight: "40px" };
const emptyTextStyle = { color: "#888", fontSize: "1.1rem", fontStyle: "italic" };

// סטייל לבאדג' החדש "In active group"
const activeGroupBannerStyle = {
  backgroundColor: "#eef6ff",
  border: "1px solid #cce5ff",
  borderRadius: "12px",
  padding: "6px 14px",
  fontSize: "0.85rem",
  fontWeight: "700",
  color: "#333",
  marginBottom: "10px",
  display: "inline-block"
};

const activeGroupLinkStyle = {
  color: "#0070f3",
  textDecoration: "underline",
  fontWeight: "800",
  marginLeft: "5px",
  textTransform: "uppercase"
};

const buttonWrapperStyle = { padding: "0 1.5rem 1.5rem", display: "flex", justifyContent: "center" };
const centeredRemoveBtnStyle = { 
  width: "100%", 
  maxWidth: "180px", 
  padding: "10px", 
  backgroundColor: "transparent", 
  color: "#ff4d4f", 
  border: "2px solid #ff4d4f", 
  borderRadius: "10px", 
  fontWeight: "800", 
  fontSize: "0.8rem", 
  cursor: "pointer", 
  transition: "all 0.2s" 
};