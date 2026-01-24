/**
 * Import Utilities
 * Functions for importing data from CSV files
 */

import type { JobApplication, ApplicationStatus } from '@/types';
import Papa from 'papaparse';

export interface ImportResult {
  success: boolean;
  imported: JobApplication[];
  errors: ImportError[];
  skipped: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

/**
 * Import applications from CSV file
 */
export async function importFromCSV(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImportResult> {
  return new Promise((resolve) => {
    const errors: ImportError[] = [];
    const imported: JobApplication[] = [];
    let skipped = 0;
    let rowCount = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header: string): string => {
        // Normalize headers (trim whitespace, handle variations)
        return header.trim().toLowerCase();
      },
      step: (results: Papa.ParseStepResult<Record<string, any>>) => {
        const row = results.data as Record<string, any>;
        rowCount++;

        // Validate and transform row
        const validation = validateAndTransformRow(row, rowCount);

        if (validation.success && validation.application) {
          imported.push(validation.application);
        } else {
          if (validation.errors) {
            errors.push(...validation.errors);
          }
          skipped++;
        }

        // Report progress
        if (onProgress && rowCount % 10 === 0) {
          onProgress(Math.min(90, (rowCount / 100) * 90)); // Reserve last 10% for completion
        }
      },
      complete: () => {
        if (onProgress) onProgress(100);

        resolve({
          success: errors.length === 0 || imported.length > 0,
          imported,
          errors,
          skipped,
        });
      },
      error: (error: Error) => {
        resolve({
          success: false,
          imported: [],
          errors: [
            {
              row: 0,
              message: `Failed to parse CSV: ${error.message}`,
            },
          ],
          skipped: 0,
        });
      },
    });
  });
}

/**
 * Validate and transform a CSV row into a JobApplication
 */
function validateAndTransformRow(
  row: Record<string, any>,
  rowIndex: number
): {
  success: boolean;
  application?: JobApplication;
  errors?: ImportError[];
} {
  const errors: ImportError[] = [];

  // Map common header variations
  const company =
    row.company || row.companyname || row['company name'] || row.employer || '';
  const role =
    row.role ||
    row.position ||
    row.jobtitle ||
    row['job title'] ||
    row.title ||
    '';
  const dateApplied =
    row.dateapplied ||
    row['date applied'] ||
    row.date ||
    row.applicationdate ||
    row['application date'] ||
    '';
  const status = row.status || row.applicationstatus || row['application status'] || '';
  const visaSponsorship =
    row.visasponsorship ||
    row['visa sponsorship'] ||
    row.visa ||
    row.sponsorship ||
    '';

  // Validate required fields
  if (!company || company.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'company',
      message: 'Company name is required',
      data: row,
    });
  } else if (company.trim().length > 100) {
    errors.push({
      row: rowIndex,
      field: 'company',
      message: 'Company name must be 100 characters or less',
      data: row,
    });
  }

  if (!role || role.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'role',
      message: 'Role/Position is required',
      data: row,
    });
  } else if (role.trim().length > 100) {
    errors.push({
      row: rowIndex,
      field: 'role',
      message: 'Role/Position must be 100 characters or less',
      data: row,
    });
  }

  if (!dateApplied || dateApplied.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'dateApplied',
      message: 'Date applied is required',
      data: row,
    });
  }

  // Validate date format
  const parsedDate = parseDate(dateApplied);
  if (!parsedDate) {
    errors.push({
      row: rowIndex,
      field: 'dateApplied',
      message: `Invalid date format: "${dateApplied}". Expected YYYY-MM-DD or common date formats`,
      data: row,
    });
  }

  // Validate and normalize status
  const normalizedStatus = normalizeStatus(status);
  if (!normalizedStatus) {
    errors.push({
      row: rowIndex,
      field: 'status',
      message: `Invalid status: "${status}". Must be one of: Applied, Phone Screen, Technical Interview, Final Round, Offer, Rejected`,
      data: row,
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Parse visa sponsorship
  const parsedVisa = parseBoolean(visaSponsorship);

  // Create application object
  const application: JobApplication = {
    id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    company: company.trim(),
    role: role.trim(),
    dateApplied: parsedDate!,
    status: normalizedStatus!,
    visaSponsorship: parsedVisa,
    timestamp: Date.now(),
  };

  return { success: true, application };
}

/**
 * Parse various date formats into YYYY-MM-DD
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Try to parse with Date constructor
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    // Convert to YYYY-MM-DD using UTC to avoid timezone issues
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Try common formats manually
  // MM/DD/YYYY or M/D/YYYY
  const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch && mdyMatch[1] && mdyMatch[2] && mdyMatch[3]) {
    const month = mdyMatch[1];
    const day = mdyMatch[2];
    const year = mdyMatch[3];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // DD/MM/YYYY or D/M/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch && dmyMatch[1] && dmyMatch[2] && dmyMatch[3]) {
    const day = dmyMatch[1];
    const month = dmyMatch[2];
    const year = dmyMatch[3];
    // Assume DD/MM/YYYY if day > 12
    if (parseInt(day) > 12) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Normalize status to match ApplicationStatus type
 */
function normalizeStatus(status: string): ApplicationStatus | null {
  if (!status) return null;

  const normalized = status.trim().toLowerCase();

  const statusMap: Record<string, ApplicationStatus> = {
    applied: 'Applied',
    'phone screen': 'Phone Screen',
    phonescreen: 'Phone Screen',
    phone: 'Phone Screen',
    screening: 'Phone Screen',
    'technical interview': 'Technical Interview',
    technical: 'Technical Interview',
    interview: 'Technical Interview',
    coding: 'Technical Interview',
    'final round': 'Final Round',
    final: 'Final Round',
    onsite: 'Final Round',
    offer: 'Offer',
    accepted: 'Offer',
    hired: 'Offer',
    rejected: 'Rejected',
    declined: 'Rejected',
    closed: 'Rejected',
  };

  return statusMap[normalized] || null;
}

/**
 * Parse boolean values from various formats
 */
function parseBoolean(value: string): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'true' ||
    normalized === 'yes' ||
    normalized === 'y' ||
    normalized === '1' ||
    normalized === 'checked'
  );
}

/**
 * Trigger file picker for CSV import
 */
export function triggerCSVImport(
  onImport: (result: ImportResult) => void,
  onProgress?: (progress: number) => void
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,text/csv';
  input.style.display = 'none';

  input.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    
    // User cancelled file selection
    if (!file) {
      onImport({
        success: false,
        imported: [],
        errors: [],
        skipped: 0,
      });
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      onImport({
        success: false,
        imported: [],
        errors: [
          {
            row: 0,
            message: 'Invalid file type. Please select a CSV file.',
          },
        ],
        skipped: 0,
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onImport({
        success: false,
        imported: [],
        errors: [
          {
            row: 0,
            message: 'File is too large. Maximum size is 5MB.',
          },
        ],
        skipped: 0,
      });
      return;
    }

    try {
      const result = await importFromCSV(file, onProgress);
      onImport(result);
    } catch (error) {
      onImport({
        success: false,
        imported: [],
        errors: [
          {
            row: 0,
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        skipped: 0,
      });
    }
  });

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

/**
 * Format import result as a user-friendly message
 */
export function formatImportResult(result: ImportResult): {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
} {
  if (!result.success && result.imported.length === 0) {
    return {
      title: 'Import Failed',
      message:
        result.errors[0]?.message ||
        'Failed to import applications. Please check your CSV file.',
      type: 'error',
    };
  }

  if (result.imported.length === 0) {
    return {
      title: 'No Applications Imported',
      message: 'No valid applications found in the CSV file.',
      type: 'warning',
    };
  }

  const successCount = result.imported.length;
  const errorCount = result.errors.length;

  if (errorCount > 0) {
    return {
      title: 'Partial Import',
      message: `Successfully imported ${successCount} application${successCount !== 1 ? 's' : ''}. ${errorCount} row${errorCount !== 1 ? 's' : ''} had errors and were skipped.`,
      type: 'warning',
    };
  }

  return {
    title: 'Import Successful',
    message: `Successfully imported ${successCount} application${successCount !== 1 ? 's' : ''}!`,
    type: 'success',
  };
}

/**
 * Generate a detailed error report for import errors
 */
export function generateErrorReport(errors: ImportError[]): string {
  if (errors.length === 0) return '';

  let report = 'Import Errors:\n\n';

  errors.forEach((error, index) => {
    report += `${index + 1}. Row ${error.row}`;
    if (error.field) {
      report += ` - Field: ${error.field}`;
    }
    report += `\n   ${error.message}\n`;
  });

  return report;
}