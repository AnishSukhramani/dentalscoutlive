"use client"
import React from 'react'
import { useState } from "react";
// import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx"; 
import Papa from "papaparse"; 
import { supabase } from "@/lib/supabaseClient"; // ✅ Supabase client import
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";


const UploadFile = () => {
    const [isCsv, setIsCsv] = useState(false);
    const [fileMetrics, setFileMetrics] = useState(null); 
    const [filePreview, setFilePreview] = useState([]); 
    const [showAdditional, setShowAdditional] = useState(false);
    const [columnMapping, setColumnMapping] = useState({ 
        practiceName: "",
        practiceUrl: "",
        ownerName: "",
        email: "",
        phone: "",
        firstName: "",
    });
    const acceptedFileTypes = isCsv
    ? ".csv"
    : ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const [allRows, setAllRows] = useState([]); // ✅ Store all entries
    const [hasHeader, setHasHeader] = useState(true); // ✅ Track toggle for header row
    const [filteredJson, setFilteredJson] = useState(null); // ✅ Store filtered output
    const [uploading, setUploading] = useState(false);


  const handleToggleChange = (checked) => {
    setIsCsv(checked);
    setFileMetrics(null); 
    setFilePreview([]); // ✅ CLEAR preview when switching type
    setColumnMapping({ practiceName: "", practiceUrl: "", ownerName: "", email: "", phone: "", firstName: "" });
    setAllRows([]);
    setFilteredJson(null);
  };
  const handleHeaderToggle = (checked) => {
    setHasHeader(checked);
  };
  const handleMappingChange = (field, value) => { // ✅ Handler to update mapping state
    setColumnMapping((prev) => ({ ...prev, [field]: value }));
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSize = (file.size / 1024).toFixed(2) + " KB";

    if (isCsv) {
      const reader = new FileReader();
      reader.onload = (event) => {
        Papa.parse(event.target.result, {
          header: hasHeader,
          skipEmptyLines: true,
          complete: function (results) {
            const columnNames = hasHeader ? results.meta.fields : results.data[0];
            const dataRows = hasHeader ? results.data : results.data.slice(1);
            const preview = dataRows.slice(0, 5);
            setFileMetrics({ columnNames, numRows: dataRows.length, fileSize });
            setFilePreview(preview);
            setAllRows(dataRows);
          },
        });
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: hasHeader ? 0 : 1 });

        const columnNames = Object.keys(jsonData[0]);
        const preview = jsonData.slice(0, 5);
        setFileMetrics({ columnNames, numRows: jsonData.length, fileSize });
        setFilePreview(preview);
        setAllRows(jsonData);
      };
      reader.readAsBinaryString(file);
    }
  };
  const isMappingComplete = columnMapping.practiceName && columnMapping.practiceUrl && columnMapping.ownerName; // ✅ Mapping completeness check
  const handleUpload = async () => {
    const { practiceName, practiceUrl, ownerName, email, phone, firstName } = columnMapping;
    if (!isMappingComplete) return;

    const filtered = allRows.filter((row) => {
      const value = row[practiceUrl];
      return value !== undefined && value !== null && value.toString().trim() !== "";
    });

    const mappedEntries = filtered.map((row) => {
      const entry = {
        practice_name: row[practiceName],
        domain_url: row[practiceUrl],
        owner_name: row[ownerName],
      };
      if (email) entry.email = row[email];
      if (phone) entry.phone_number = row[phone];
      if (firstName) entry.first_name = row[firstName];
      return entry;
    });
    
    setFilteredJson({
      hasHeader,
      entries: mappedEntries,
    });
    try {
      setUploading(true);
      const { error } = await supabase.from("practices").insert(mappedEntries);
      if (error) {
        console.error("Supabase insert error:", error);
        toast.error("Error uploading data: " + error.message);
      } else {
        toast.success("Upload successful!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Unexpected error uploading data");
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <Toaster position="top-center" richColors />
      <div className="mb-6 p-4 rounded-xl glass border flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-2">Upload Practice Data</h1>
        <div className="flex items-center gap-4">
          <span className="text-base font-medium">Excel</span>
          <Switch id="file-toggle" checked={isCsv} onCheckedChange={handleToggleChange} />
          <span className="text-base font-medium">CSV</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-base font-medium">Does the file have a header row?</span>
          <Switch id="header-toggle" checked={hasHeader} onCheckedChange={handleHeaderToggle} />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <label htmlFor="file-upload" className="block text-sm font-medium mb-2">Choose File</label>
          <div className="relative group flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-background py-6 px-4 transition-all duration-200 cursor-pointer mb-1 shadow-sm border-[color:var(--hairline-color)] hover:opacity-80 focus-within:opacity-100">
            <Input id="file-upload" type="file" accept={acceptedFileTypes} onChange={handleFileChange} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" />
            <span className="text-4xl mb-2 pointer-events-none">📁</span>
            <span className="text-base font-medium mb-1 pointer-events-none">Click or drag file to upload</span>
            <span className="text-xs text-gray-500 pointer-events-none">Accepted: {isCsv ? ".csv" : ".xls, .xlsx"}</span>
          </div>
        </div>
        {fileMetrics && (
          <div className="bg-foreground/5 p-4 rounded-lg shadow-inner flex flex-col gap-1 mt-2 border">
            <p><strong>File Size:</strong> {fileMetrics.fileSize}</p>
            <p><strong>Number of Entries:</strong> {fileMetrics.numRows}</p>
            <p><strong>Columns:</strong> {fileMetrics.columnNames.join(", ")}</p>
          </div>
        )}
      </div>

      {/* MAPPING UI: Shown only after file loaded */}
      {fileMetrics?.columnNames?.length > 0 && (
        <div className="space-y-4 glass p-6 border rounded-xl shadow mb-6 animate-fade-in">
          <h2 className="font-semibold text-lg mb-2">Map Required Fields</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Required fields */}
            <div>
              <label className="block text-sm font-medium mb-1">Practice Name Column <span className="opacity-70">*</span></label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus-visible:outline-2 transition-all duration-150"
                value={columnMapping.practiceName}
                onChange={(e) => handleMappingChange("practiceName", e.target.value)}
              >
                <option value="">-- Select Column --</option>
                {fileMetrics.columnNames.map((col, idx) => (
                  <option key={idx} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Practice Website URL Column <span className="opacity-70">*</span></label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus-visible:outline-2 transition-all duration-150"
                value={columnMapping.practiceUrl}
                onChange={(e) => handleMappingChange("practiceUrl", e.target.value)}
              >
                <option value="">-- Select Column --</option>
                {fileMetrics.columnNames.map((col, idx) => (
                  <option key={idx} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Owner Full Name Column <span className="opacity-70">*</span></label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus-visible:outline-2 transition-all duration-150"
                value={columnMapping.ownerName}
                onChange={(e) => handleMappingChange("ownerName", e.target.value)}
              >
                <option value="">-- Select Column --</option>
                {fileMetrics.columnNames.map((col, idx) => (
                  <option key={idx} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Expandable Additional Mapping */}
          <div className="mt-6">
            <button
              type="button"
              className="flex items-center gap-2 font-semibold focus:outline-none hover:underline"
              onClick={() => setShowAdditional((v) => !v)}
              aria-expanded={showAdditional}
            >
              {showAdditional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Additional Mapping (optional)
            </button>
            {showAdditional && (
              <div className="mt-4 p-4 bg-foreground/5 border rounded-lg shadow-inner space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Column</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 focus-visible:outline-2 transition-all duration-150"
                    value={columnMapping.email}
                    onChange={(e) => handleMappingChange("email", e.target.value)}
                  >
                    <option value="">-- None --</option>
                    {fileMetrics.columnNames.map((col, idx) => (
                      <option key={idx} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number Column</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 focus-visible:outline-2 transition-all duration-150"
                    value={columnMapping.phone}
                    onChange={(e) => handleMappingChange("phone", e.target.value)}
                  >
                    <option value="">-- None --</option>
                    {fileMetrics.columnNames.map((col, idx) => (
                      <option key={idx} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">First Name Column</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 focus-visible:outline-2 transition-all duration-150"
                    value={columnMapping.firstName}
                    onChange={(e) => handleMappingChange("firstName", e.target.value)}
                  >
                    <option value="">-- None --</option>
                    {fileMetrics.columnNames.map((col, idx) => (
                      <option key={idx} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {filePreview.length > 0 && (
        <div className="overflow-auto glass rounded-xl shadow p-6 border mb-6 animate-fade-in">
          <h2 className="font-semibold mb-2">File Preview (first 5 rows)</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {fileMetrics?.columnNames?.map((col, idx) => (
                  <th key={idx} className="border px-2 py-1 bg-foreground/5">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filePreview.map((row, idx) => (
                <tr key={idx} className="hover:bg-foreground/6 transition-colors">
                  {fileMetrics.columnNames.map((col, colIdx) => (
                    <td key={colIdx} className="border px-2 py-1">{row[col] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <Button disabled={!isMappingComplete || uploading} onClick={handleUpload}>
          {uploading ? (
            <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Uploading...</span>
          ) : (
            "Upload"
          )}
        </Button>
      </div>

      {filteredJson && (
        <div className="mt-6 p-4 bg-foreground/5 border rounded-xl animate-fade-in">
          <h3 className="font-bold mb-2">Filtered JSON Output</h3>
          <pre className="text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(filteredJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default UploadFile
