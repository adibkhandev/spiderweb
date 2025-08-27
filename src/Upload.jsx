import React, { useEffect, useRef, useState } from "react";

const UPLOAD_URL = "http://127.0.0.1:8000/upload";

export default function FullScreenPdfDrop() {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);
  // drag depth counter prevents flicker when moving over children
  const dragDepth = useRef(0);

  useEffect(() => {
    const onDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    };

    const onDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current += 1;
      setDragActive(true);
    };

    const onDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        setDragActive(false);
      }
    };

    const onDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setDragActive(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const picked = files[0];
      if (!isPdf(picked)) {
        alert("Please drop a PDF file (.pdf).");
        return;
      }

      setFileName(picked.name);
      await upload(picked);
    };

    // Attach to window so drop works anywhere on the screen
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const isPdf = (file) => {
    // Some browsers don’t set type on drop; fall back to extension check.
    return (
      file.type === "application/pdf" ||
      /\.pdf$/i.test(file.name ?? "")
    );
  };

  const pickFile = () => inputRef.current?.click();

  const onFilePicked = async (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!isPdf(picked)) {
      alert("Please select a PDF file (.pdf).");
      e.target.value = ""; // reset
      return;
    }
    setFileName(picked.name);
    await upload(picked);
    e.target.value = ""; // allow re-upload same file
  };

  const upload = async (pdfFile) => {
    try {
      setStatus("Uploading…");
      const formData = new FormData();
      formData.append("file", pdfFile);

      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log(data)

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

      setStatus(`✅ Uploaded to: ${data.path || "server"}`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload failed. Check console and CORS/back-end.");
    }
  };

  return (
    <div
      onClick={pickFile}
      className={`w-screen h-screen flex flex-col items-center justify-center select-none transition
        ${dragActive ? "bg-blue-50" : "bg-gray-100"}`}
      style={{ cursor: "pointer" }}
      title="Click to choose a PDF or drag one anywhere"
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onFilePicked}
        hidden
      />

      <div className="text-center">
        <div className="text-2xl font-semibold mb-2">
          {dragActive ? "Drop your PDF…" : "Drag & Drop a PDF anywhere"}
        </div>
        <div className="text-sm text-gray-600">
          or <span className="underline">click to choose</span>
        </div>
        {fileName && (
          <div className="mt-4 text-gray-700">Selected: {fileName}</div>
        )}
        {status && <div className="mt-2">{status}</div>}
      </div>

      {/* Optional visual overlay */}
      {dragActive && (
        <div className="pointer-events-none fixed inset-0 border-4 border-dashed border-blue-400 rounded-2xl m-4" />
      )}
    </div>
  );
}
