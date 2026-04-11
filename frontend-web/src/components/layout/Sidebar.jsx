import { MaterialIcon, Button } from "../ui";
import { th, C } from "../../utils/theme";
import { NAV_ITEMS } from "../../data/mockData";
import { Plus } from "lucide-react";

export default function Sidebar({ page, dark, navigate, onNewFile }) {
  const t = th(dark);

  return (
    <aside style={{
      width: 210, background: t.sidebarBg, flexShrink: 0,
      display: "flex", flexDirection: "column", padding: "16px 10px",
      overflowY: "auto", borderRight: `1px solid ${t.border}`,
    }}>
      <div style={{ padding: "0 4px", marginBottom: 18 }}>
        <Button style={{ width: "100%" }} onClick={onNewFile}>
          <Plus size={16} /> Nouveau
        </Button>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.page === page && (item.label === "Mon Drive" ? page === "drive" : true) ||
                           item.page === page && page !== "drive";
          return (
            <div
              key={item.label}
              className={`nav-item${isActive ? " active" : ""}`}
              style={{ color: isActive ? "#1a73e8" : t.muted }}
              onClick={() => navigate(item.page)}
            >
              <MaterialIcon n={item.icon} s={19} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Stockage */}
      <div style={{ marginTop: "auto", padding: "14px 6px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: t.muted }}>
          <MaterialIcon n="cloud_queue" s={14} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".10em" }}>Stockage</span>
        </div>
        <div style={{ background: t.mid, borderRadius: 9999, height: 6, marginBottom: 6 }}>
          <div className="progress" style={{ width: "60%" }} />
        </div>
        <span style={{ fontSize: 11, color: t.muted }}>18 Go / 30 Go</span>
      </div>
    </aside>
  );
}
