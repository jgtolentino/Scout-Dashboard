import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Dataset } from '@/types';

export async function parseCSVFile(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }

        const data = results.data as any[];
        const columns = results.meta.fields || [];

        resolve({
          id: `dataset-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          data,
          columns,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

export async function parseExcelFile(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });

        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        const columns = Object.keys(jsonData[0]);

        resolve({
          id: `dataset-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          data: jsonData,
          columns,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function parseJSONFile(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);

        let data: any[];
        
        // Handle different JSON structures
        if (Array.isArray(jsonData)) {
          data = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          data = jsonData.data;
        } else if (jsonData.rows && Array.isArray(jsonData.rows)) {
          data = jsonData.rows;
        } else {
          // Try to find the first array property
          const arrayProp = Object.keys(jsonData).find(
            (key) => Array.isArray(jsonData[key])
          );
          if (arrayProp) {
            data = jsonData[arrayProp];
          } else {
            throw new Error('No array data found in JSON file');
          }
        }

        if (data.length === 0) {
          throw new Error('JSON array is empty');
        }

        // Extract columns from the first object
        const columns = Object.keys(data[0]);

        resolve({
          id: `dataset-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          data,
          columns,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        reject(new Error(`Failed to parse JSON file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

export async function handleFileUpload(file: File): Promise<Dataset> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return parseCSVFile(file);
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file);
    case 'json':
      return parseJSONFile(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

export function exportToCSV(dataset: Dataset): void {
  const csv = Papa.unparse(dataset.data);
  downloadFile(csv, `${dataset.name}.csv`, 'text/csv');
}

export function exportToJSON(dataset: Dataset): void {
  const json = JSON.stringify(dataset.data, null, 2);
  downloadFile(json, `${dataset.name}.json`, 'application/json');
}

export function exportToExcel(dataset: Dataset): void {
  const worksheet = XLSX.utils.json_to_sheet(dataset.data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  downloadFile(blob, `${dataset.name}.xlsx`);
}

function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}