"use client";

import React, { createContext, useContext, useState } from "react";

interface DocumentContextType {
  files: File[];
  setFiles: (files: File[]) => void;
  clearFiles: () => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  // Stored strictly in client-side memory; no localStorage or sessionStorage
  const [files, setFiles] = useState<File[]>([]);

  const clearFiles = () => {
    setFiles([]);
  };

  return (
    <DocumentContext.Provider value={{ files, setFiles, clearFiles }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocumentFiles() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocumentFiles must be used within a DocumentProvider");
  }
  return context;
}
