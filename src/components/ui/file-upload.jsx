"use client"
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { IconUpload, IconX, IconFile } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * Aceternity-style File Upload component
 * Docs: https://ui.aceternity.com/components/file-upload
 *
 * Props:
 * - onChange: (files: File[]) => void
 * - accept?: string (comma-separated accept string, e.g. ".csv" or ".xls,.xlsx")
 * - multiple?: boolean (default false)
 * - className?: string
 */
export function FileUpload({ onChange, accept, multiple = false, className }) {
  const [files, setFiles] = useState([]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      setFiles(acceptedFiles);
      if (onChange) onChange(acceptedFiles);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
  });

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative glassdark group flex flex-col items-center justify-center border-2 border-dashed rounded-xl",
          "bg-background py-10 px-4 transition-all duration-200 cursor-pointer mb-3",
          "shadow-sm border-[color:var(--hairline-color)] hover:opacity-90 focus-within:opacity-100",
          isDragActive && "opacity-100 border-foreground/40"
        )}
      >
        <input {...getInputProps({ accept })} />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <div className="h-10 w-10 rounded-lg bg-foreground/10 flex items-center justify-center">
            <IconUpload size={20} className="text-[#dadada]" />
          </div>
          <p className="text-sm text-[#b5b5b5] font-medium">
            {isDragActive ? "Drop the files here" : "Drag or drop your files here or click to upload"}
          </p>
        </div>
        {/* subtle grid background */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(to_right,rgba(var(--foreground-rgb),0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--foreground-rgb),0.06)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between border rounded-lg px-3 py-2 bg-background/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <IconFile size={18} className="text-[#b5b5b5]" />
                <span className="text-sm text-[#b5b5b5] truncate" title={file.name}>{file.name}</span>
              </div>
              <button
                type="button"
                className="text-xs text-[#b5b5b5] inline-flex items-center gap-1 hover:opacity-80"
                onClick={() => {
                  const next = files.filter((_, i) => i !== idx);
                  setFiles(next);
                  if (onChange) onChange(next);
                }}
                aria-label="Remove file"
              >
                <IconX size={14} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;


