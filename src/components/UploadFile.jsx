"use client"
import React from 'react'
import { useState } from "react";
import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx"; 
import Papa from "papaparse"; 


const UploadFile = () => {
    const [isCsv, setIsCsv] = useState(false);
    const [fileMetrics, setFileMetrics] = useState(null); 
    const [filePreview, setFilePreview] = useState([]); // ✅ NEW: State to store preview rows
    const [columnMapping, setColumnMapping] = useState({ // ✅ NEW: Track selected mappings
        practiceName: "",
        practiceUrl: "",
        ownerName: "",
    });
    const acceptedFileTypes = isCsv
    ? ".csv"
    : ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const [allRows, setAllRows] = useState([]); // ✅ Store all entries
    const [hasHeader, setHasHeader] = useState(true); // ✅ Track toggle for header row
    const [filteredJson, setFilteredJson] = useState(null); // ✅ Store filtered output


  const handleToggleChange = (checked) => {
    setIsCsv(checked);
    setFileMetrics(null); 
    setFilePreview([]); // ✅ CLEAR preview when switching type
    setColumnMapping({ practiceName: "", practiceUrl: "", ownerName: "" }); // ✅ CLEAR mapping on switch
    setColumnMapping({ practiceName: "", practiceUrl: "", ownerName: "" });
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
  const handleUpload = () => {
    const { practiceName, practiceUrl, ownerName } = columnMapping;
    if (!practiceName || !practiceUrl || !ownerName) return;

    const filtered = allRows.filter((row) => {
      const value = row[practiceUrl];
      return value !== undefined && value !== null && value.toString().trim() !== "";
    });

    const output = filtered.map((row) => ({
      ["Practice Name"]: row[practiceName],
      ["Practice Website URL"]: row[practiceUrl],
      ["Owner Full Name"]: row[ownerName],
    }));

    setFilteredJson({
      hasHeader,
      entries: output,
    });
  };


  return (
    <div>
      <div className="flex items-center space-x-2">
        <p>Excel</p>
        <Switch id="file-toggle" checked={isCsv} onCheckedChange={handleToggleChange} />
        <p>CSV</p>
      </div>

      <div className="flex items-center space-x-2">
        <p>Does the file have a header row?</p>
        <Switch id="header-toggle" checked={hasHeader} onCheckedChange={handleHeaderToggle} />
      </div>

      

      <Input id="file-upload" type="file" accept={acceptedFileTypes} onChange={handleFileChange} />
      {fileMetrics && (
        <div className="bg-gray-100 p-4 rounded shadow">
          <p><strong>File Size:</strong> {fileMetrics.fileSize}</p>
          <p><strong>Number of Entries:</strong> {fileMetrics.numRows}</p>
          <p><strong>Columns:</strong> {fileMetrics.columnNames.join(", ")}</p>
        </div>
      )}

      {/* ✅ MAPPING UI: Shown only after file loaded */}
      {fileMetrics?.columnNames?.length > 0 && (
        <div className="space-y-2 bg-white p-4 border rounded shadow">
          <h2 className="font-semibold">Map Required Fields</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium">Practice Name Column</label>
              <select
                className="w-full border rounded px-2 py-1"
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
              <label className="block text-sm font-medium">Practice Website URL Column</label>
              <select
                className="w-full border rounded px-2 py-1"
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
              <label className="block text-sm font-medium">Owner Full Name Column</label>
              <select
                className="w-full border rounded px-2 py-1"
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
        </div>
      )}

{filePreview.length > 0 && (
        <div className="overflow-auto bg-white rounded shadow p-4 border">
          <h2 className="font-semibold mb-2">File Preview (first 5 rows)</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {fileMetrics?.columnNames?.map((col, idx) => (
                  <th key={idx} className="border px-2 py-1 bg-gray-200">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filePreview.map((row, idx) => (
                <tr key={idx}>
                  {fileMetrics.columnNames.map((col, colIdx) => (
                    <td key={colIdx} className="border px-2 py-1">{row[col] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button disabled={!isMappingComplete} onClick={handleUpload}>
        Upload
      </Button>

      {/* ✅ Output Section */}
      {filteredJson && (
        <div className="mt-6 p-4 bg-gray-100 border rounded">
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
