import React, { useEffect, useRef, useState } from "react";
import { set, get } from "idb-keyval";
const FullScreenPdfDrop = (props) => {
  console.log("Child received props:", props);

  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  // drag depth counter prevents flicker when moving over children
  const dragDepth = useRef(0);
   useEffect(()=>{
        console.log(props.pdfile,'d')
    },[props.pdfile])
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
      props.setPdfile(picked);
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
  useEffect(()=>{
       if(props.pdfile) {
         set("pdfInDb", props.pdfile)
            .then(()=>{
              console.log('file saved')
            })
       }
       else{
         get("pdfInDb").then((savedFile) => {
            if (savedFile) props.setPdfile(savedFile);
        });
       }
  },[props.pdfile])

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
    props.setPdfile(picked)
    e.target.value = ""; // allow re-upload same file
  };



  return (
    <div className="start">
    <h1>Drop pdf file here</h1>
    <div
      onClick={pickFile}
      className={`none w-screen h-screen flex flex-col items-center justify-center select-none transition
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
      

      {/* Optional visual overlay */}
      {dragActive && (
        <div className="pointer-events-none fixed inset-0 border-4 border-dashed border-blue-400 rounded-2xl m-4" />
      )}
    </div>
    </div>
  );
}

export default FullScreenPdfDrop
