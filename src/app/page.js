"use client"

import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx"; 
import Papa from "papaparse"; 

export default function Home() {
  const [isCsv, setIsCsv] = useState(false);
  const [fileMetrics, setFileMetrics] = useState(null); 
  const [filePreview, setFilePreview] = useState([]); // ✅ NEW: State to store preview rows
  const acceptedFileTypes = isCsv
    ? ".csv"
    : ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const handleToggleChange = (checked) => {
    setIsCsv(checked);
    setFileMetrics(null); 
    setFilePreview([]); // ✅ CLEAR preview when switching type
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSize = (file.size / 1024).toFixed(2) + " KB";

    if (isCsv) {
      const reader = new FileReader();
      reader.onload = (event) => {
        Papa.parse(event.target.result, {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            const columnNames = results.meta.fields;
            const numRows = results.data.length;
            const preview = results.data.slice(0, 5); // ✅ Slice first 5 rows
            setFileMetrics({ columnNames, numRows, fileSize });
            setFilePreview(preview);
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const columnNames = jsonData[0];
        const numRows = jsonData.length - 1;
        const previewRows = jsonData.slice(1, 6).map(row => {
          const rowObject = {};
          columnNames.forEach((col, i) => {
            rowObject[col] = row[i];
          });
          return rowObject;
        });
        setFileMetrics({ columnNames, numRows, fileSize });
        setFilePreview(previewRows);
      };
      reader.readAsBinaryString(file);
    }
  };


  return (
    <div className="space-y-4 p-4 bg-custom">
      <h1 className="text-blue-500 font-bold text-xl">Neurality Health</h1>

      <div className="flex items-center space-x-2">
        <p>Excel</p>
        <Switch id="file-toggle" checked={isCsv} onCheckedChange={handleToggleChange} />
        <p>CSV</p>
      </div>

      <div className="flex items-center space-x-2">
      <p>Does the file have a header row?</p>
      <Switch id="header-toggle" />
      </div>

      

      <Input id="file-upload" type="file" accept={acceptedFileTypes} onChange={handleFileChange} />
      {fileMetrics && (
        <div className="bg-gray-100 p-4 rounded shadow">
          <p><strong>File Size:</strong> {fileMetrics.fileSize}</p>
          <p><strong>Number of Entries:</strong> {fileMetrics.numRows}</p>
          <p><strong>Columns:</strong> {fileMetrics.columnNames.join(", ")}</p>
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

      <Button>Upload</Button>
    </div>
  );
}
