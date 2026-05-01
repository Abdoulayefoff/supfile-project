import apiClient from "./client";
import { FileItem, FolderItem, Breadcrumb } from "../types";

export const filesApi = {
  getFiles: async (
    folderId?: number,
  ): Promise<{ files: FileItem[]; folders: FolderItem[] }> => {
    const params = folderId ? { folderId } : {};
    const res = await apiClient.get("/files", { params });

    const raw = Array.isArray(res.data) ? res.data : (res.data.files ?? []);
    const folders = Array.isArray(res.data) ? [] : (res.data.folders ?? []);

    const files = raw.map((f: any) => ({
      ...f,
      size: Number(f.size),
      name: decodeURIComponent(f.name),
    }));

    return { files, folders };
  },

  getFolders: async (parentId?: number): Promise<FolderItem[]> => {
    const params = parentId ? { parentId } : {};
    const res = await apiClient.get("/folders", { params });
    return res.data;
  },

  getBreadcrumbs: async (folderId: number): Promise<Breadcrumb[]> => {
    const res = await apiClient.get(`/folders/${folderId}/breadcrumbs`);
    return res.data;
  },

  createFolder: async (
    name: string,
    parentId?: number,
  ): Promise<FolderItem> => {
    const res = await apiClient.post("/folders", {
      name,
      parentId: parentId ?? null,
    });
    return res.data;
  },

  renameFile: async (id: number, name: string): Promise<FileItem> => {
    const res = await apiClient.patch(`/files/${id}`, { name });
    return res.data;
  },

  renameFolder: async (id: number, name: string): Promise<FolderItem> => {
    const res = await apiClient.patch(`/folders/${id}`, { name });
    return res.data;
  },

  deleteFile: async (id: number): Promise<void> => {
    await apiClient.delete(`/files/${id}`);
  },

  deleteFolder: async (id: number): Promise<void> => {
    await apiClient.delete(`/folders/${id}`);
  },

  moveFile: async (id: number, folderId: number | null): Promise<FileItem> => {
    const res = await apiClient.patch(`/files/${id}/move`, {
      targetFolderId: folderId,
    });
    return res.data;
  },

  moveFolder: async (
    id: number,
    folderId: number | null,
  ): Promise<FolderItem> => {
    const res = await apiClient.patch(`/folders/${id}/move`, {
      targetFolderId: folderId,
    });
    return res.data;
  },

  downloadFolder: async (id: number): Promise<string> => {
    const res = await apiClient.get(`/folders/${id}/download`, {
      responseType: "blob",
    });
    return res.data;
  },
};
