import { th, C } from "../../utils/theme";
import MaterialIcon from "../../components/ui/MaterialIcon";

export default function ContextMenu({ ctx, dark, navigate, onShare, onClose }) {
  const t = th(dark);

  const actions = [
    { icon:"visibility",               label:"Prévisualiser",       color:t.text,    action: () => { navigate("preview", { file:ctx.file }); onClose(); } },
    { icon:"download",                  label:"Télécharger",         color:t.text,    action: onClose },
    { icon:"star",                      label:"Ajouter aux favoris", color:C.amber,   action: onClose },
    { icon:"share",                     label:"Partager",            color:C.primary, action: () => { onShare(ctx.file); onClose(); } },
    { icon:"drive_file_rename_outline", label:"Renommer",            color:t.text,    action: onClose },
    { icon:"delete",                    label:"Supprimer",           color:C.red,     action: onClose },
  ];

  return (
    <div style={{
      position:"fixed", zIndex:300, left:ctx.x, top:ctx.y,
      background:t.surface, borderRadius:11, padding:5,
      boxShadow:"0 8px 32px rgba(0,0,0,.18)", border:`1px solid ${t.border}`, minWidth:170,
    }} className="fade">
      {actions.map(item => (
        <div key={item.label} className="ctx-item" style={{ color:item.color }} onClick={item.action}>
          <MaterialIcon n={item.icon} s={16} c={item.color} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
