import { useEffect, useState } from "react";
import api from "../services/api";

// ============================================================
// DONNÉES OFFICIELLES extraites des documents AT
// Noms du personnel : fictifs (comme demandé par l'encadreur)
// Structure : officielle (extraite du mémoire ISIL E-014)
// ============================================================

const orgData = {
  id: "pdg",
  title: "Président Directeur Général",
  name: "M. Karim Bensalem",
  email: "pdg@algerietelecom.dz",
  phone: "+213 21 XXX XXX",
  color: "#003DA5",
  children: [
    {
      id: "cellule",
      title: "Cellule Reporting & Analyse",
      name: "Mme. Nadia Khelifi",
      email: "reporting@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#555",
      children: [],
    },
    {
      id: "inspection",
      title: "Inspection Générale",
      name: "M. Mourad Tebbal",
      email: "inspection@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#555",
      children: [],
    },
    {
      id: "dsi",
      title: "Division Systèmes d'Information",
      name: "M. Yacine Boudiaf",
      email: "dsi@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#00A650",
      children: [
        {
          id: "dir-secu",
          title: "Direction Sécurité des Systèmes d'Information",
          name: "M. Amar Bouzidi",
          email: "securite.si@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#00A650",
          children: [],
        },
        {
          id: "dir-infra",
          title: "Direction Infrastructures Informatiques",
          name: "Mme. Samira Hadj-Ali",
          email: "infra.info@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#00A650",
          children: [],
        },
        {
          id: "dir-dev",
          title: "Direction Développement Systèmes d'Information",
          name: "M. Rachid Ferhat",
          email: "dev.si@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#00A650",
          children: [],
        },
        {
          id: "dir-billing",
          title: "Direction Systèmes Billings",
          name: "Mme. Farida Amrane",
          email: "billing@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#00A650",
          children: [],
        },
      ],
    },
    {
      id: "drh",
      title: "Division Ressources Humaines et Formation",
      name: "Mme. Leila Mebarki",
      email: "drh@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#003DA5",
      children: [
        {
          id: "dir-carrieres",
          title: "Direction Gestion des Carrières et des Compétences",
          name: "M. Djamel Ouali",
          email: "carrieres@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#003DA5",
          children: [],
        },
        {
          id: "dir-formation",
          title: "Direction de la Formation",
          name: "Mme. Houria Belkacemi",
          email: "formation@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#003DA5",
          children: [
            {
              id: "dept-qualite",
              title: "Département Développement et Management de la Qualité",
              name: "M. Samir Bencherif",
              email: "qualite@algerietelecom.dz",
              phone: "+213 21 XXX XXX",
              color: "#003DA5",
              children: [
                { id: "s-qualite", title: "Service Management de la Qualité", name: "Mme. Assia Boudali", email: "s.qualite@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
                { id: "s-etude", title: "Service Etude & Développement Formation", name: "M. Hocine Zeroual", email: "s.etude@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
                { id: "s-support", title: "Service Support, Suivi, Budget & Reporting", name: "Mme. Rania Tlemcani", email: "s.support@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
              ],
            },
            {
              id: "dept-competences",
              title: "Département Développement des Compétences",
              name: "M. Kamel Ghribi",
              email: "competences@algerietelecom.dz",
              phone: "+213 21 XXX XXX",
              color: "#003DA5",
              children: [
                { id: "s-tech", title: "Service Formations Techniques", name: "M. Nabil Kara", email: "s.tech@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
                { id: "s-manag", title: "Service Formations Managériales et Commerciales", name: "Mme. Wafa Benali", email: "s.manag@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
                { id: "s-cadres", title: "Service Formations Cadres Supérieurs & Clients Partenaires", name: "M. Sofiane Laib", email: "s.cadres@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
              ],
            },
            {
              id: "dept-veille",
              title: "Département Veille Formation & Partenariats",
              name: "Mme. Nabila Sediki",
              email: "veille@algerietelecom.dz",
              phone: "+213 21 XXX XXX",
              color: "#003DA5",
              children: [
                { id: "s-veille", title: "Service Veille Formation & Partenariats Nationaux & Internationaux", name: "M. Tarek Mahiout", email: "s.veille@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
                { id: "s-etude2", title: "Service Etude & Développement Formation", name: "Mme. Imane Bensaid", email: "s.etude2@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
              ],
            },
          ],
        },
        {
          id: "dir-relations",
          title: "Direction des Relations Socioprofessionnelles",
          name: "M. Hamid Mekki",
          email: "relations.soc@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#003DA5",
          children: [],
        },
        {
          id: "dir-etudes",
          title: "Direction des Etudes",
          name: "Mme. Zohra Bendjama",
          email: "etudes@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#003DA5",
          children: [],
        },
      ],
    },
    {
      id: "dcm",
      title: "Division Commerciale, Communication et Marketing",
      name: "M. Bilal Hadidi",
      email: "commercial@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#00A650",
      children: [],
    },
    {
      id: "dfc",
      title: "Division Finances & Comptabilité",
      name: "Mme. Karima Bouziane",
      email: "finances@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#003DA5",
      children: [],
    },
    {
      id: "dir-interconnexion",
      title: "Division Interconnexion et Relations Internationales",
      name: "M. Adel Boukhobza",
      email: "interconnexion@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#00A650",
      children: [],
    },
    {
      id: "dir-surete",
      title: "Direction Sûreté Interne de l'Entreprise",
      name: "M. Lotfi Aoudjane",
      email: "surete@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#555",
      children: [],
    },
    {
      id: "dir-juridique",
      title: "Direction Affaires Juridiques",
      name: "Mme. Sara Benkhalil",
      email: "juridique@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#555",
      children: [],
    },
    {
      id: "dir-audit",
      title: "Direction Audit Interne",
      name: "M. Fares Toumi",
      email: "audit@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#555",
      children: [],
    },
    {
      id: "dir-achats",
      title: "Division Achats, Moyens & Patrimoine",
      name: "Mme. Djamila Rekik",
      email: "achats@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#00A650",
      children: [],
    },
    {
      id: "pole-infra",
      title: "Pôle Infrastructures et Réseaux",
      name: "M. Abdelaziz Guerroudj",
      email: "infra@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#003DA5",
      children: [
        {
          id: "div-transport",
          title: "Division Réseaux Transport",
          name: "M. Hani Beddiaf",
          email: "reseaux.transport@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#003DA5",
          children: [],
        },
        {
          id: "div-core",
          title: "Division Réseau Core",
          name: "Mme. Lydia Chaker",
          email: "reseau.core@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#003DA5",
          children: [],
        },
        {
          id: "div-acces",
          title: "Division Réseaux Accès",
          name: "M. Mehdi Bouchenak",
          email: "reseaux.acces@algerietelecom.dz",
          phone: "+213 21 XXX XXX",
          color: "#003DA5",
          children: [],
        },
      ],
    },
    {
      id: "do",
      title: "Directions Opérationnelles (60 DO)",
      name: "Directions Régionales",
      email: "do@algerietelecom.dz",
      phone: "+213 21 XXX XXX",
      color: "#555",
      children: [
        { id: "do-alger1", title: "DOT Alger Centre", name: "M. Chaabane Khelil", email: "alger1@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
        { id: "do-alger2", title: "DOT Alger Est", name: "Mme. Nassira Belmahi", email: "alger2@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
        { id: "do-alger3", title: "DOT Alger Ouest", name: "M. Omar Brahimi", email: "alger3@at.dz", phone: "+213 21 XXX XXX", color: "#555", children: [] },
      ],
    },
  ],
};

// ============================================================
// COMPOSANT CARTE
// ============================================================
function OrgCard({ node, depth, onSelect, selected, usersByStructure }) {
  const isSelected = selected?.id === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = depth === 0;
  const nodeUsers = usersByStructure?.[node.id] || [];

  const bgColor = isRoot
    ? "#003DA5"
    : node.color === "#00A650"
    ? "#00A650"
    : node.color === "#003DA5"
    ? "#003DA5"
    : "#4b5563";

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      style={{
        background: isSelected
          ? "#fff"
          : `${bgColor}15`,
        border: `2px solid ${isSelected ? bgColor : bgColor + "60"}`,
        borderRadius: isRoot ? "12px" : "8px",
        padding: isRoot ? "16px 20px" : "10px 14px",
        cursor: "pointer",
        minWidth: isRoot ? "220px" : "160px",
        maxWidth: isRoot ? "260px" : "200px",
        textAlign: "center",
        transition: "all 0.2s ease",
        boxShadow: isSelected ? `0 4px 20px ${bgColor}40` : "none",
        position: "relative",
      }}
    >
      {/* Avatar initials */}
      <div style={{
        width: isRoot ? 40 : 30,
        height: isRoot ? 40 : 30,
        borderRadius: "50%",
        background: bgColor,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: isRoot ? 14 : 11,
        fontWeight: "bold",
        margin: "0 auto 8px",
      }}>
        {node.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div style={{
        fontSize: isRoot ? 13 : 10,
        fontWeight: "700",
        color: isSelected ? bgColor : "#1f2937",
        lineHeight: 1.3,
        marginBottom: 4,
      }}>
        {node.title}
      </div>
      <div style={{
        fontSize: isRoot ? 11 : 9,
        color: "#6b7280",
        fontStyle: "italic",
      }}>
        {node.name}
      </div>
      {/* Badge utilisateurs (dynamique BD) */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          padding: "4px 8px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          background: nodeUsers.length > 0 ? "#16a34a" : "#9ca3af",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.35)",
        }}
      >
        {nodeUsers.length > 0 ? `${nodeUsers.length} 👤` : "Poste vacant"}
      </div>
      {hasChildren && (
        <div style={{
          position: "absolute",
          bottom: -8,
          left: "50%",
          transform: "translateX(-50%)",
          background: bgColor,
          color: "#fff",
          borderRadius: "50%",
          width: 16,
          height: 16,
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
        }}>
          {node.children.length}
        </div>
      )}
    </div>
  );
}

// ============================================================
// NOEUD D'ARBRE (récursif)
// ============================================================
function TreeNode({ node, depth, onSelect, selected, expandedIds, toggleExpand, usersByStructure }) {
  const isExpanded = expandedIds.includes(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <OrgCard node={node} depth={depth} onSelect={onSelect} selected={selected} usersByStructure={usersByStructure} />
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
            style={{
              position: "absolute",
              bottom: -20,
              left: "50%",
              transform: "translateX(-50%)",
              background: isExpanded ? "#ef4444" : "#00A650",
              border: "none",
              borderRadius: "50%",
              width: 20,
              height: 20,
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              lineHeight: 1,
            }}
          >
            {isExpanded ? "−" : "+"}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Ligne verticale descendante */}
          <div style={{ width: 2, height: 20, background: "#d1d5db" }} />
          {/* Ligne horizontale */}
          {node.children.length > 1 && (
            <div style={{
              width: `${node.children.length * 220}px`,
              height: 2,
              background: "#d1d5db",
              maxWidth: "90vw",
            }} />
          )}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {node.children.map((child) => (
              <div key={child.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 20, background: "#d1d5db" }} />
                <TreeNode
                  node={child}
                  depth={depth + 1}
                  onSelect={onSelect}
                  selected={selected}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  usersByStructure={usersByStructure}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PANNEAU DÉTAIL
// ============================================================
function DetailPanel({ node, onClose, usersByStructure }) {
  if (!node) return null;
  const bgColor = node.color === "#00A650" ? "#00A650" : node.color === "#003DA5" ? "#003DA5" : "#4b5563";
  const nodeUsers = usersByStructure?.[node.id] || [];

  const roleStyle = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") return { background: "#2563eb", color: "#fff" };
    if (r === "validateur") return { background: "#f59e0b", color: "#111827" };
    if (r === "demandeur") return { background: "#16a34a", color: "#fff" };
    return { background: "#9ca3af", color: "#fff" };
  };

  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: 0,
      bottom: 0,
      width: 320,
      background: "#fff",
      boxShadow: "-4px 0 30px rgba(0,0,0,0.15)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      animation: "slideIn 0.3s ease",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      {/* Header */}
      <div style={{ background: bgColor, padding: "24px 20px", color: "#fff" }}>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          cursor: "pointer",
          padding: "4px 10px",
          fontSize: 12,
          marginBottom: 12,
        }}>← Fermer</button>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 12,
        }}>
          {(nodeUsers[0]?.name || node.name).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
          {nodeUsers.length > 0 ? `${nodeUsers.length} utilisateur(s)` : "Poste vacant"}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>{node.title}</div>
      </div>

      {/* Body */}
      <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
        <InfoRow icon="✉️" label="Email" value={node.email} />
        <InfoRow icon="📞" label="Téléphone" value={node.phone} />
        {node.children && node.children.length > 0 && (
          <InfoRow icon="👥" label="Sous-structures" value={`${node.children.length} unité(s)`} />
        )}

        {/* Utilisateurs réels (BD) */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
            Utilisateurs affectés
          </div>
          {nodeUsers.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nodeUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{u.name}</div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 999,
                        ...roleStyle(u.role),
                      }}
                    >
                      {u.role || "—"}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>{u.email}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "12px 12px", borderRadius: 10, background: "#f9fafb", border: "1px dashed #d1d5db" }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Aucun utilisateur affecté à cette structure.</div>
              <button
                onClick={() => window.location.assign(`/admin/utilisateurs?structure=${encodeURIComponent(node.id)}`)}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                  background: "#00A650",
                  color: "#fff",
                }}
              >
                ➕ Affecter un utilisateur
              </button>
            </div>
          )}
        </div>

        <div style={{
          marginTop: 20,
          padding: "12px 14px",
          background: "#f9fafb",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: "600" }}>
            NOTE
          </div>
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
            Les informations de contact sont fictives conformément aux exigences de confidentialité d'Algérie Télécom. La structure hiérarchique est officielle.
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      display: "flex",
      gap: 12,
      padding: "12px 0",
      borderBottom: "1px solid #f3f4f6",
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: "600", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#1f2937" }}>{value}</div>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function Organigramme() {
  const [selected, setSelected] = useState(null);
  const [expandedIds, setExpandedIds] = useState(["pdg"]);
  const [search, setSearch] = useState("");
  const [usersByStructure, setUsersByStructure] = useState({});

  useEffect(() => {
    let mounted = true;
    api.get("/users/by-structure")
      .then((res) => {
        if (!mounted) return;
        setUsersByStructure(res.data || {});
      })
      .catch(() => {
        if (!mounted) return;
        setUsersByStructure({});
      });
    return () => { mounted = false; };
  }, []);

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    const collectIds = (node) => [node.id, ...(node.children || []).flatMap(collectIds)];
    setExpandedIds(collectIds(orgData));
  };

  const collapseAll = () => setExpandedIds(["pdg"]);

  // Recherche dans l'arbre
  const searchResults = [];
  const searchTree = (node) => {
    const q = search.toLowerCase();
    if (
      node.name.toLowerCase().includes(q) ||
      node.title.toLowerCase().includes(q)
    ) {
      searchResults.push(node);
    }
    (node.children || []).forEach(searchTree);
  };
  if (search.trim()) searchTree(orgData);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #003DA5 0%, #00A650 100%)",
        padding: "20px 24px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}>🏢</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: "800", letterSpacing: "-0.5px" }}>
              Algérie Télécom
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Organigramme Général Interactif
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Recherche */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher..."
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              outline: "none",
              backdropFilter: "blur(4px)",
              width: 180,
            }}
          />
          <button onClick={expandAll} style={btnStyle("#00A650")}>Tout déplier</button>
          <button onClick={collapseAll} style={btnStyle("rgba(255,255,255,0.2)")}>Tout replier</button>
        </div>
      </div>

      {/* LÉGENDE */}
      <div style={{
        display: "flex",
        gap: 16,
        padding: "12px 24px",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        flexWrap: "wrap",
      }}>
        <LegendItem color="#003DA5" label="Direction / Division Centrale" />
        <LegendItem color="#00A650" label="Division Technique / Commerciale" />
        <LegendItem color="#4b5563" label="Direction Support / Opérationnelle" />
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>
          * Noms fictifs — Structure officielle AT
        </div>
      </div>

      {/* RÉSULTATS DE RECHERCHE */}
      {search.trim() && (
        <div style={{ padding: "16px 24px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            {searchResults.length} résultat(s) pour "{search}"
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {searchResults.map((r) => (
              <div
                key={r.id}
                onClick={() => { setSelected(r); setSearch(""); }}
                style={{
                  padding: "6px 12px",
                  background: "#f3f4f6",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontWeight: "600" }}>{r.name}</span>
                <span style={{ color: "#6b7280" }}> — {r.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARBRE */}
      <div style={{
        padding: "40px 24px",
        overflowX: "auto",
        overflowY: "auto",
        minHeight: "calc(100vh - 160px)",
        paddingRight: selected ? 360 : 24,
      }}>
        <div style={{ display: "inline-block", minWidth: "100%" }}>
          <TreeNode
            node={orgData}
            depth={0}
            onSelect={setSelected}
            selected={selected}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            usersByStructure={usersByStructure}
          />
        </div>
      </div>

      {/* PANNEAU DÉTAIL */}
      {selected && (
        <DetailPanel node={selected} onClose={() => setSelected(null)} usersByStructure={usersByStructure} />
      )}
    </div>
  );
}

function btnStyle(bg) {
  return {
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "600",
    background: bg,
    color: "#fff",
  };
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
    </div>
  );
}

