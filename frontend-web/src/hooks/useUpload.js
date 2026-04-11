import { useState } from "react";

/**
 * Gère l'état d'une zone d'upload (drag-and-drop + input file).
 */
export function useUpload() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragging, setDragging]     = useState(false);
  const [uploaded, setUploaded]     = useState([]);

  const openModal  = () => setUploadOpen(true);
  const closeModal = () => { setUploadOpen(false); setUploaded([]); };

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault(); setDragging(false);
    setUploaded(prev => [...prev, ...Array.from(e.dataTransfer.files).map(f => f.name)]);
  };
  const onFileInput = (e) =>
    setUploaded(prev => [...prev, ...Array.from(e.target.files || []).map(f => f.name)]);

  return { uploadOpen, dragging, uploaded, openModal, closeModal, onDragOver, onDragLeave, onDrop, onFileInput };
}
