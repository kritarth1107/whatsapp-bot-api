import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

/**
 * Generates an Excel file from the given data
 * @param data - The data to generate the Excel file from
 * 
 * Data Structure Example:
 * [
 *   {
 *     paymentId: string,           // Unique payment identifier
 *     category: string,            // Payment category (CC_PAYMENT/BANK_TRANSFER)
 *     bank: string,                // Bank name
 *     account: string,             // Account number
 *     name: string,                // Account holder name
 *     type: string,                // Account type
 *     ifsc: string,                // IFSC code
 *     mobile: string,              // Mobile number
 *     amount: number,              // Payment amount
 *     status: string,              // Payment status
 *     createdAt: string,           // Formatted creation date (DD-MM-YYYY HH:mm:ss A)
 *     ref: string                  // Reference number
 *   }
 * ]
 * 
 * @returns The Excel file buffer or file path
 */
const generateExcel = (data: any[]): {excelBuffer: Buffer, fileName: string} => {
    try {
        // ===== VALIDATE INPUT DATA =====
        // Check if data array is provided and not empty
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('Data must be a non-empty array');
        }

        // ===== DEFINE HEADERS =====
        // Define column headers based on the data structure
        const headers = [
            'Payment ID',
            'Category',
            'Bank',
            'Account Number',
            'Account Holder Name',
            'Account Type',
            'IFSC Code',
            'Mobile Number',
            'Amount',
            'Status',
            'Created At',
            'Reference Number'
        ];

        // ===== MAP DATA TO HEADERS =====
        // Transform data to match header order and format
        const excelData = data.map(item => [
            item.paymentId || '',
            item.category || '',
            item.bank || '',
            item.account || '',
            item.name || '',
            item.type || '',
            item.ifsc || '',
            item.mobile || '',
            item.amount || 0,
            item.status || '',
            item.createdAt || '',
            item.ref || ''
        ]);

        // ===== CREATE WORKBOOK =====
        // Create a new workbook and worksheet
        const workbook = XLSX.utils.book_new();
        
        // ===== ADD HEADERS TO DATA =====
        // Combine headers with data for complete Excel structure
        const completeData = [headers, ...excelData];
        
        // ===== CREATE WORKSHEET =====
        // Convert data to worksheet format
        const worksheet = XLSX.utils.aoa_to_sheet(completeData);

        // ===== SET COLUMN WIDTHS =====
        // Define optimal column widths for better readability
        const columnWidths = [
            { wch: 15 },  // Payment ID
            { wch: 12 },  // Category
            { wch: 20 },  // Bank
            { wch: 15 },  // Account Number
            { wch: 20 },  // Account Holder Name
            { wch: 12 },  // Account Type
            { wch: 12 },  // IFSC Code
            { wch: 15 },  // Mobile Number
            { wch: 12 },  // Amount
            { wch: 10 },  // Status
            { wch: 20 },  // Created At
            { wch: 15 }   // Reference Number
        ];
        worksheet['!cols'] = columnWidths;

        // ===== STYLE HEADER ROW =====
        // Apply styling to header row (bold, background color)
        const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "CCCCCC" } },
                    alignment: { horizontal: "center" }
                };
            }
        }

        // ===== ADD WORKSHEET TO WORKBOOK =====
        // Add the worksheet to the workbook with a descriptive name
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Data');

        // ===== GENERATE EXCEL BUFFER =====
        // Convert workbook to buffer for file download or storage
        const excelBuffer = XLSX.write(workbook, { 
            type: 'buffer', 
            bookType: 'xlsx',
            compression: true
        });

        // ===== OPTIONAL: SAVE TO FILE =====

        const uploadsDir = path.join(process.cwd(), 'uploads', 'excel');
            
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
            
        const fileName = `PAYMENTS-${new Date().getTime()}.xlsx`;
        // const filePath = path.join(uploadsDir, `PAYMENTS-${fileName}.xlsx`);
        // fs.writeFileSync(filePath, excelBuffer);

        return {
            excelBuffer,
            fileName
        };

    } catch (error) {
        console.error('Error generating Excel file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to generate Excel file: ${errorMessage}`);
    }
};

/**
 * Read Excel file and extract data in the same format as the data example array
 * Ignores the first row (header) and maps Excel columns to the expected data structure
 * 
 * @param filePath - Path to the Excel file to read
 * @returns Array of payment data objects matching the data structure example
 * @throws Error - If file cannot be read or data is invalid
 */
const readExcelAndGetData = (filePath: string): any[] => {
    try {
        // ===== VALIDATE FILE PATH =====
        // Check if file exists and is accessible
        if (!fs.existsSync(filePath)) {
            throw new Error(`Excel file not found: ${filePath}`);
        }

        // ===== READ EXCEL FILE =====
        // Read the Excel workbook from the file path
        const workbook = XLSX.readFile(filePath);
        
        // ===== GET FIRST WORKSHEET =====
        // Get the first worksheet from the workbook
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error('No worksheets found in Excel file');
        }
        
        const sheet = workbook.Sheets[sheetName];
        
        // ===== CONVERT TO ARRAY OF ARRAYS =====
        // Convert sheet to array format to access raw data (including headers)
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // ===== VALIDATE DATA STRUCTURE =====
        // Check if data exists and has at least 2 rows (header + data)
        if (!rawData || rawData.length < 2) {
            throw new Error('Excel file must contain at least header row and one data row');
        }

        // ===== REMOVE HEADER ROW =====
        // Remove the first row (header) and keep only data rows
        const dataRows = rawData.slice(1);
        
        // ===== MAP DATA TO EXPECTED FORMAT =====
        // Transform Excel rows to match the data structure example
        const mappedData = dataRows.map((row: unknown, index: number) => {
            // ===== VALIDATE ROW DATA =====
            // Ensure row has enough columns for all required fields
            if (!Array.isArray(row) || row.length < 12) {
                console.warn(`Row ${index + 2} has insufficient data, skipping...`);
                return null;
            }

            // ===== MAP COLUMNS TO DATA STRUCTURE =====
            // Map Excel columns to the expected data structure
            // Column order: Payment ID, Category, Bank, Account Number, Account Holder Name, 
            // Account Type, IFSC Code, Mobile Number, Amount, Status, Created At, Reference Number
            const paymentData = {
                paymentId: String(row[0] || '').trim(),           // Payment ID
                category: String(row[1] || '').trim(),            // Category
                bank: String(row[2] || '').trim(),                // Bank
                account: String(row[3] || '').trim(),             // Account Number
                name: String(row[4] || '').trim(),                // Account Holder Name
                type: String(row[5] || '').trim(),                // Account Type
                ifsc: String(row[6] || '').trim(),                // IFSC Code
                mobile: String(row[7] || '').trim(),              // Mobile Number
                amount: Number(row[8]) || 0,                      // Amount
                status: String(row[9] || '').trim(),              // Status
                createdAt: String(row[10] || '').trim(),          // Created At
                ref: String(row[11] || '').trim()                 // Reference Number
            };

            // ===== VALIDATE REQUIRED FIELDS =====
            // Check if essential fields are present
            if (!paymentData.paymentId || !paymentData.amount) {
                console.warn(`Row ${index + 2} missing required fields (Payment ID or Amount), skipping...`);
                return null;
            }

            return paymentData;
        }).filter(Boolean); // Remove null entries (invalid rows)

        // ===== VALIDATE FINAL DATA =====
        // Check if any valid data was extracted
        if (mappedData.length === 0) {
            throw new Error('No valid payment data found in Excel file');
        }

        console.log(`Successfully read ${mappedData.length} payment records from Excel file`);
        return mappedData;

    } catch (error) {
        console.error('Error reading Excel file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to read Excel file: ${errorMessage}`);
    }
};

export {generateExcel, readExcelAndGetData};