// client/src/pages/admin/products.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { http } from "../../config/http";

const emptyForm = {
  name: "",
  price: 0,
  category: "",
  stock: 0,
  description: "",
  imageUrl: "",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imgPreviewError, setImgPreviewError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  function copyId(id) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const isAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    return !!user?.is_admin;
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        setError("");
        setLoading(true);
        const res = await http.get("/api/products");
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, isAdmin]);

  function startCreate() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setImgPreviewError("");
  }

  function startEdit(p) {
    setMode("edit");
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      price: Number(p.price || 0),
      category: p.category || "",
      stock: Number(p.stock || 0),
      description: p.description || "",
      imageUrl: p.imageUrl || "",
    });
    setError("");
    setImgPreviewError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await http.delete(`/api/products/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) startCreate();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete product");
    }
  }

  function normalizeImageUrl(url) {
    const u = (url || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) return `https://${u}`;
    return u;
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      price: Number(form.price),
      category: form.category,
      stock: form.stock === "" ? 0 : Number(form.stock),
      description: form.description || undefined,
      imageUrl: form.imageUrl ? normalizeImageUrl(form.imageUrl) : undefined,
    };

    try {
      if (mode === "create") {
        const res = await http.post("/api/products", payload);
        setItems((prev) => [res.data, ...prev]);
      } else {
        const res = await http.patch(`/api/products/${editingId}`, payload);
        setItems((prev) => prev.map((x) => (x.id === editingId ? res.data : x)));
      }
      startCreate();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Save failed";
      if (Array.isArray(msg)) setError(msg.join(" | "));
      else setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = form.imageUrl ? normalizeImageUrl(form.imageUrl) : "";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .admin-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #2c2e33;
          border-radius: 8px;
          background: #1a1b1e;
          color: #c1c2c5;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
          margin-top: 6px;
          display: block;
        }
        .admin-input:focus { border-color: #228be6; }
        .admin-label { font-size: 0.8rem; font-weight: 700; color: #909296; text-transform: uppercase; letter-spacing: 0.5px; }
        .db-row:hover td { background: #1e1f22; }
        .action-btn { padding: 5px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; border: none; transition: opacity 0.15s; white-space: nowrap; }
        .action-btn:hover { opacity: 0.8; }
      `}</style>

      <div style={{ minHeight: "100vh", backgroundColor: "#141517", color: "#c1c2c5", direction: "ltr" }}>
        {/* Admin Header */}
        <div style={{ background: "#1a1b1e", borderBottom: "1px solid #2c2e33", padding: "16px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#fff" }}>
            <span style={{ color: "#228be6" }}>Buy</span>Force
          </span>
          <span style={{ background: "#f08c00", color: "#fff", padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "900", letterSpacing: "1px" }}>ADMIN</span>
          <span style={{ color: "#909296", fontSize: "0.9rem", marginLeft: "8px" }}>/ Products</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "20px" }}>
            <a href="/admin/users" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Users</a>
            <a href="/admin/groups" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Groups</a>
            <a href="/" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Home</a>
          </div>
        </div>

        <div style={{ padding: "32px", maxWidth: "1600px", margin: "0 auto" }}>
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "900", color: "#fff" }}>Products</h1>
            <span style={{ color: "#909296", fontSize: "0.9rem" }}>{items.length} products total</span>
          </div>

          {error && (
            <div style={{ background: "#2c1a1a", border: "1px solid #5c2020", color: "#fa5252", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#909296", fontSize: "1.1rem" }}>Loading products...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>

              {/* Product Database Table */}
              <section style={{ background: "#1a1b1e", borderRadius: "12px", border: "1px solid #2c2e33", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #2c2e33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>Product Database</h2>
                  <button onClick={startCreate} style={{ background: "#228be6", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}>
                    + New Product
                  </button>
                </div>

                {items.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", color: "#909296" }}>No products yet.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #2c2e33" }}>
                          {["Image", "Name", "Category", "Price", "Stock", "Description", "ID", "Actions"].map((h) => (
                            <th key={h} style={{ padding: "12px 16px", fontSize: "0.72rem", fontWeight: "800", color: "#909296", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((p) => (
                          <tr key={p.id} className="db-row" style={{ borderBottom: "1px solid #25262b", background: editingId === p.id ? "#1e2a38" : "transparent" }}>
                            <td style={{ padding: "10px 16px" }}>
                              <div style={{ width: 40, height: 40, background: "#25262b", borderRadius: "6px", overflow: "hidden", display: "grid", placeItems: "center" }}>
                                {p.imageUrl
                                  ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                  : <span style={{ fontSize: "10px", color: "#5c5f66" }}>—</span>
                                }
                              </div>
                            </td>
                            <td style={{ padding: "10px 16px", fontWeight: "700", color: "#fff", whiteSpace: "nowrap", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</td>
                            <td style={{ padding: "10px 16px" }}>
                              <span style={{ background: "#25262b", padding: "3px 8px", borderRadius: "4px", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{p.category}</span>
                            </td>
                            <td style={{ padding: "10px 16px", color: "#20c997", fontWeight: "700", whiteSpace: "nowrap" }}>₪{p.price}</td>
                            <td style={{ padding: "10px 16px", color: p.stock > 0 ? "#c1c2c5" : "#fa5252", whiteSpace: "nowrap" }}>{p.stock}</td>
                            <td style={{ padding: "10px 16px", fontSize: "0.82rem", color: "#909296", maxWidth: "220px" }}>
                              {p.description
                                ? (p.description.length > 60 ? p.description.slice(0, 60) + "…" : p.description)
                                : <span style={{ color: "#5c5f66", fontStyle: "italic" }}>—</span>
                              }
                            </td>
                            <td style={{ padding: "10px 16px" }}>
                              <button
                                className="action-btn"
                                onClick={() => copyId(p.id)}
                                title={p.id}
                                style={{ background: copiedId === p.id ? "#1b3a2a" : "#25262b", color: copiedId === p.id ? "#20c997" : "#909296", border: `1px solid ${copiedId === p.id ? "#20c997" : "#2c2e33"}`, fontFamily: "monospace", fontSize: "0.7rem", letterSpacing: "0.3px" }}
                              >
                                {copiedId === p.id ? "✓ Copied" : p.id.slice(0, 8) + "…"}
                              </button>
                            </td>
                            <td style={{ padding: "10px 16px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button className="action-btn" onClick={() => startEdit(p)} style={{ background: "#1971c2", color: "#fff" }}>Edit</button>
                                <button className="action-btn" onClick={() => remove(p.id)} style={{ background: "#2c1a1a", color: "#fa5252", border: "1px solid #5c2020" }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Form Panel */}
              <section style={{ background: "#1a1b1e", borderRadius: "12px", border: "1px solid #2c2e33", padding: "24px", position: "sticky", top: "24px" }}>
                <h2 style={{ margin: "0 0 20px 0", fontSize: "1rem", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {mode === "create" ? "New Product" : "Edit Product"}
                </h2>

                <form onSubmit={submit} style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label className="admin-label">Product Name</label>
                    <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Wireless Headphones" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="admin-label">Price (₪)</label>
                      <input className="admin-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} min={0} required />
                    </div>
                    <div>
                      <label className="admin-label">Stock</label>
                      <input className="admin-input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} min={0} />
                    </div>
                  </div>
                  <div>
                    <label className="admin-label">Category</label>
                    <input className="admin-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required placeholder="e.g. Electronics" />
                  </div>
                  <div>
                    <label className="admin-label">Description</label>
                    <textarea className="admin-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: "80px", resize: "vertical" }} placeholder="Short product description..." />
                  </div>
                  <div>
                    <label className="admin-label">Image URL</label>
                    <input className="admin-input" value={form.imageUrl} onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setImgPreviewError(""); }} placeholder="https://example.com/image.jpg" />
                  </div>

                  {previewUrl && (
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "#25262b", padding: "12px", borderRadius: "8px" }}>
                      <div style={{ width: 56, height: 56, borderRadius: "6px", overflow: "hidden", background: "#2c2e33", flexShrink: 0 }}>
                        <img src={previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgPreviewError("Image failed to load")} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#909296", fontWeight: "700", textTransform: "uppercase" }}>Preview</div>
                        {imgPreviewError && <div style={{ color: "#fa5252", fontSize: "0.8rem", marginTop: "4px" }}>{imgPreviewError}</div>}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button type="submit" disabled={saving} style={{ flex: 1, background: "#228be6", color: "#fff", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "800", fontSize: "0.9rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                      {saving ? "Saving..." : mode === "create" ? "Create Product" : "Update Product"}
                    </button>
                    {mode === "edit" && (
                      <button type="button" onClick={startCreate} style={{ background: "#25262b", color: "#909296", border: "1px solid #2c2e33", borderRadius: "8px", padding: "12px 16px", fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </section>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
