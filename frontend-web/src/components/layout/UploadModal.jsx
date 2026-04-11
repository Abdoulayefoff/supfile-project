import { Upload, X } from "lucide-react";
import { MaterialIcon, IconButton, Button } from "../ui";
import { th, C } from "../../utils/theme";

export default function UploadModal({ dark, onClose, dragging, uploaded, onDragOver, onDragLeave, onDrop, onFileInput }) {
  const t = th(dark);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: t.surface, borderRadius: 24, padding: 28, width: 460, boxShadow: "0 24px 80px rgba(0,0,0,.2)" }} className="fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: t.text }}>Nouveau fichier</h3>
          <IconButton onClick={onClose} color={t.muted}><X size={18} /></IconButton>
        </div>

        <div
          className={`upload-zone${dragging ? " drag" : ""}`}
          style={{ borderColor: dragging ? "#005bbf" : t.border, color: t.muted }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById("sf-fi")?.click()}
        >
          <Upload size={32} color={dragging ? "#005bbf" : t.muted} />
          <p style={{ fontWeight: 600, color: t.text }}>Glissez vos fichiers ici</p>
          <p style={{ fontSize: 13 }}>ou cliquez pour parcourir</p>
          <input id="sf-fi" type="file" multiple style={{ display: "none" }} onChange={onFileInput} />
        </div>

        {uploaded.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {uploaded.map((n, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: t.low }}>
                <MaterialIcon n="insert_drive_file" s={18} c={C.primary} />
                <span style={{ flex: 1, fontSize: 13, color: t.text, fontWeight: 500 }}>{n}</span>
                <div style={{ width: 72, background: t.mid, borderRadius: 9999, height: 4 }}>
                  <div className="progress" style={{ width: "100%" }} />
                </div>
                <MaterialIcon n="check_circle" s={16} c={C.green} fill />
              </div>
            ))}
            <Button style={{ marginTop: 6, width: "100%" }} onClick={onClose}>
              Confirmer l'upload
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
