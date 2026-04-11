import { th } from "../../utils/theme";
import { useUpload } from "../../hooks/useUpload";
import Header      from "./Header";
import Sidebar     from "./Sidebar";
import UploadModal from "./UploadModal";

export default function Layout({ children, page, dark, navigate, toggleDark }) {
  const t      = th(dark);
  const upload = useUpload();

  return (
    <div style={{
      minHeight:  "100vh",
      background: t.bg,
      color:      t.text,
      fontFamily: "'Inter',sans-serif",
      display:    "flex",
      flexDirection: "column",
    }}>
      <Header dark={dark} navigate={navigate} toggleDark={toggleDark} />

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <Sidebar page={page} dark={dark} navigate={navigate} onNewFile={upload.openModal} />
        <main style={{ flex:1, overflowY:"auto", padding:"30px 34px", background:t.bg }} className="fade">
          {children}
        </main>
      </div>

      {upload.uploadOpen && (
        <UploadModal
          dark={dark}
          onClose={upload.closeModal}
          dragging={upload.dragging}
          uploaded={upload.uploaded}
          onDragOver={upload.onDragOver}
          onDragLeave={upload.onDragLeave}
          onDrop={upload.onDrop}
          onFileInput={upload.onFileInput}
        />
      )}
    </div>
  );
}
