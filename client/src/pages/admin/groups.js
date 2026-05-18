// client/src/pages/admin/groups.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { http } from "../../config/http";

const emptyForm = {
  name: "",
  productId: "",
  minParticipants: "",
  isActive: true,
  deadline: "",
  discountPercent: "",
};

export default function AdminGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      setFetching(true);
      const res = await http.get("/api/admin/groups");
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to load groups";
      setError(Array.isArray(msg) ? msg.join(" | ") : String(msg));
    } finally {
      setFetching(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === "isActive") {
      setForm((prev) => ({ ...prev, isActive: type === "checkbox" ? checked : value === "true" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEdit(group) {
    setEditingId(group.id);
    setForm({
      name: group.name || "",
      productId: group.productId || (group.product ? group.product.id : ""),
      minParticipants: typeof group.minParticipants === "number" ? String(group.minParticipants) : "",
      isActive: !!group.isActive,
      deadline: group.deadline ? new Date(group.deadline).toISOString().slice(0, 16) : "",
      discountPercent: group.discountPercent != null ? String(group.discountPercent) : "",
    });
    setError("");
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this group?")) return;
    try {
      await http.delete(`/api/admin/groups/${id}`);
      await fetchGroups();
    } catch (err) {
      setError("Failed to delete group");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {};
      if (form.name?.trim()) payload.name = form.name.trim();
      if (form.productId?.trim()) payload.productId = form.productId.trim();
      if (form.minParticipants !== "") {
        const n = Number(form.minParticipants);
        if (!Number.isNaN(n)) payload.minParticipants = n;
      }
      payload.isActive = form.isActive;
      if (form.deadline) payload.deadline = form.deadline;
      if (form.discountPercent !== "") {
        const d = Number(form.discountPercent);
        if (!Number.isNaN(d)) payload.discountPercent = d;
      }

      if (editingId) {
        await http.put(`/api/admin/groups/${editingId}`, payload);
      } else {
        await http.post("/api/admin/groups", payload);
      }

      await fetchGroups();
      resetForm();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save group";
      setError(Array.isArray(msg) ? msg.join(" | ") : String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
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
        .group-row:hover { background: #1e1f22 !important; }
        .action-btn { padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; border: none; transition: opacity 0.15s; }
        .action-btn:hover { opacity: 0.8; }
      `}</style>

      <div style={{ minHeight: "100vh", backgroundColor: "#141517", color: "#c1c2c5", direction: "ltr" }}>
        {/* Admin Header */}
        <div style={{ background: "#1a1b1e", borderBottom: "1px solid #2c2e33", padding: "16px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#fff" }}>
            <span style={{ color: "#228be6" }}>Buy</span>Force
          </span>
          <span style={{ background: "#f08c00", color: "#fff", padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "900", letterSpacing: "1px" }}>ADMIN</span>
          <span style={{ color: "#909296", fontSize: "0.9rem", marginLeft: "8px" }}>/ Groups</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "20px" }}>
            <a href="/admin/users" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Users</a>
            <a href="/admin/products" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Products</a>
            <a href="/" style={{ color: "#909296", fontSize: "0.85rem", textDecoration: "none" }}>Home</a>
          </div>
        </div>

        <div style={{ padding: "32px", maxWidth: "1600px", margin: "0 auto" }}>
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "900", color: "#fff" }}>Groups</h1>
            <span style={{ color: "#909296", fontSize: "0.9rem" }}>{groups.length} groups total</span>
          </div>

          {error && (
            <div style={{ background: "#2c1a1a", border: "1px solid #5c2020", color: "#fa5252", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          {fetching ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#909296", fontSize: "1.1rem" }}>Loading groups...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px", alignItems: "start" }}>

              {/* Groups List */}
              <section style={{ background: "#1a1b1e", borderRadius: "12px", border: "1px solid #2c2e33", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #2c2e33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>All Groups</h2>
                  <button onClick={resetForm} style={{ background: "#228be6", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" }}>
                    + New Group
                  </button>
                </div>

                <div>
                  {groups.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "40px", color: "#909296" }}>No groups yet.</p>
                  ) : (
                    groups.map((g) => {
                      const isExpired = g.deadline && new Date(g.deadline) < new Date();
                      const progress = Math.min(g.progress || 0, 100);
                      const isCompleted = progress >= 100;

                      return (
                        <div
                          key={g.id}
                          className="group-row"
                          style={{ padding: "16px 20px", borderBottom: "1px solid #25262b", background: editingId === g.id ? "#1e2a38" : "transparent", transition: "background 0.15s" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: "800", color: "#fff", fontSize: "0.95rem" }}>{g.name}</span>
                                <span style={{ fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: isCompleted ? "#1b3a2a" : g.isActive ? "#1b2e3a" : "#2a1b1b", color: isCompleted ? "#20c997" : g.isActive ? "#228be6" : "#fa5252" }}>
                                  {isCompleted ? "COMPLETED" : g.isActive ? "ACTIVE" : "INACTIVE"}
                                </span>
                                {isExpired && !isCompleted && (
                                  <span style={{ fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: "#2c1a1a", color: "#f08c00" }}>EXPIRED</span>
                                )}
                              </div>

                              {g.product && (() => {
                                const disc = Number(g.discountPercent ?? 0);
                                const orig = Number(g.product.price);
                                const final = disc > 0 ? Math.round(orig * (1 - disc / 100) * 100) / 100 : null;
                                return (
                                  <div style={{ fontSize: "0.85rem", color: "#909296", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <span>Product: <span style={{ color: "#c1c2c5", fontWeight: "600" }}>{g.product.name}</span></span>
                                    {final != null ? (
                                      <>
                                        <span style={{ color: "#5c5f66", textDecoration: "line-through" }}>₪{orig}</span>
                                        <span style={{ color: "#20c997", fontWeight: "700" }}>₪{final}</span>
                                        <span style={{ background: "#1b3a2a", color: "#20c997", fontSize: "0.7rem", fontWeight: "800", padding: "2px 7px", borderRadius: "4px" }}>{disc}% OFF</span>
                                      </>
                                    ) : (
                                      <span style={{ color: "#20c997", fontWeight: "700" }}>₪{orig}</span>
                                    )}
                                  </div>
                                );
                              })()}
                              {!g.product && (
                                <div style={{ fontSize: "0.8rem", color: "#f08c00", marginBottom: "8px" }}>No product linked</div>
                              )}

                              {/* Progress Bar */}
                              <div style={{ marginBottom: "8px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#909296", marginBottom: "4px" }}>
                                  <span>{g.currentParticipants || 0} / {g.minParticipants} participants</span>
                                  <span style={{ fontWeight: "700", color: isCompleted ? "#20c997" : "#228be6" }}>{progress}%</span>
                                </div>
                                <div style={{ height: "6px", background: "#25262b", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${progress}%`, background: isCompleted ? "#20c997" : "#228be6", borderRadius: "3px", transition: "width 0.5s ease" }} />
                                </div>
                              </div>

                              {g.deadline && (
                                <div style={{ fontSize: "0.8rem", color: isExpired ? "#f08c00" : "#909296" }}>
                                  ⏰ {isExpired ? "Expired: " : "Deadline: "}{new Date(g.deadline).toLocaleString("en-GB")}
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                              <button className="action-btn" onClick={() => handleEdit(g)} style={{ background: "#1971c2", color: "#fff" }}>Edit</button>
                              <button className="action-btn" onClick={() => handleDelete(g.id)} style={{ background: "#2c1a1a", color: "#fa5252", border: "1px solid #5c2020" }}>Delete</button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Form Panel */}
              <section style={{ background: "#1a1b1e", borderRadius: "12px", border: "1px solid #2c2e33", padding: "24px", position: "sticky", top: "24px" }}>
                <h2 style={{ margin: "0 0 20px 0", fontSize: "1rem", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {editingId ? "Edit Group" : "New Group"}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label className="admin-label">Group Name</label>
                    <input className="admin-input" type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Summer Electronics Deal" />
                  </div>
                  <div>
                    <label className="admin-label">Product ID</label>
                    <input className="admin-input" type="text" name="productId" value={form.productId} onChange={handleChange} placeholder="UUID of the product" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="admin-label">Min. Participants</label>
                      <input className="admin-input" type="number" name="minParticipants" value={form.minParticipants} onChange={handleChange} min={1} placeholder="e.g. 10" />
                    </div>
                    <div>
                      <label className="admin-label">Discount %</label>
                      <input className="admin-input" type="number" name="discountPercent" value={form.discountPercent} onChange={handleChange} min={0} max={100} placeholder="e.g. 20" />
                    </div>
                  </div>
                  <div>
                    <label className="admin-label">Deadline</label>
                    <input className="admin-input" type="datetime-local" name="deadline" value={form.deadline} onChange={handleChange} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "#25262b", borderRadius: "8px" }}>
                    <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#228be6" }} />
                    <label htmlFor="isActive" style={{ cursor: "pointer", fontWeight: "600", color: "#c1c2c5", fontSize: "0.9rem" }}>Group is Active</label>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button type="submit" disabled={loading} style={{ flex: 1, background: "#228be6", color: "#fff", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "800", fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                      {loading ? "Saving..." : editingId ? "Update Group" : "Create Group"}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm} style={{ background: "#25262b", color: "#909296", border: "1px solid #2c2e33", borderRadius: "8px", padding: "12px 16px", fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" }}>
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
