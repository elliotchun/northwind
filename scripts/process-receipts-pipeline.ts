import mongoose from "mongoose";
import { readdir, stat } from "node:fs/promises";
import path from "path";
import { Employee } from "../src/models/employee";
import { Receipt } from "../src/models/receipt";
import { extractText } from "./process-receipt";

const SUBMISSIONS_DIR = path.join(__dirname, "..", "data", "submissions");

const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "pdf", "txt", "md"]);

interface Stats {
    processed: number;
    skipped: number;
    errors: number;
}

await mongoose.connect(process.env.MONGODB_URI!, {
    dbName: "northwind",
    bufferCommands: false,
});

const stats: Stats = { processed: 0, skipped: 0, errors: 0 };

const submissionDirs = await readdir(SUBMISSIONS_DIR).then(
    (dirs) => dirs.filter((d) => /^\d/.test(d)).sort()
);

for (const subDir of submissionDirs) {
    const subPath = path.join(SUBMISSIONS_DIR, subDir);
    const subStat = await stat(subPath);
    if (!subStat.isDirectory()) continue;

    const employeeInfoPath = path.join(subPath, "employee_info.json");
    const employeeContent = Bun.file(employeeInfoPath);
    const employeeInfo: { employee_id: string; name: string } = await employeeContent.json();

    let employee = await Employee.findOne({ employee_id: employeeInfo.employee_id });

    if (!employee) {
        console.log(`Employee ${employeeInfo.employee_id} (${employeeInfo.name}) not found in DB, skipping ${subDir}`);
        stats.skipped++;
        continue;
    }

    const receiptsDir = path.join(subPath, "receipts");
    let receiptsFiles: string[];
    try {
        receiptsFiles = await readdir(receiptsDir);
    } catch {
        console.log(`No receipts folder in ${subDir}`);
        stats.skipped++;
        continue;
    }

    const receiptFiles = receiptsFiles
        .filter((f) => SUPPORTED_EXTENSIONS.has(f.split(".").pop()!.toLowerCase()))
        .sort();

    console.log(`\nProcessing ${subDir} → ${employeeInfo.name} (${employeeInfo.employee_id})`);
    console.log(`  ${receiptFiles.length} receipt files`);

    for (const file of receiptFiles) {
        const filePath = path.join(receiptsDir, file);
        try {
            const text = await extractText(filePath);
            const textLines = text
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length > 0);

            if (textLines.length === 0) {
                console.log(`  ⚠ ${file} → no text extracted, skipping`);
                stats.skipped++;
                continue;
            }

            await Receipt.create({
                employee: employee._id,
                text: textLines,
            });

            stats.processed++;
            console.log(`  ✓ ${file} → ${textLines.length} lines`);
        } catch (err) {
            stats.errors++;
            console.log(`  ✗ ${file} → ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}

console.log(`\nDone. processed=${stats.processed} skipped=${stats.skipped} errors=${stats.errors}`);

await mongoose.disconnect();