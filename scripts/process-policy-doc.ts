import { parseArgs } from "util";
import pdf2md from "@opendocsg/pdf2md";

if (process.argv[1] === import.meta.filename) { // From command line
    const { values, positionals } = parseArgs({
        args: Bun.argv,
        allowPositionals: true,
    });

    if (positionals.length < 2) {
        console.error("File not provided!");
        process.exit(1);
    }

    const path = positionals[2]!;
    if (!path.endsWith(".pdf")) {
        console.error("Unsupported file extension.");
        process.exit(1);
    }
    await convertPdfToMarkdown(path, "result.md");
    console.log('Done.');
}

export async function convertPdfToMarkdown(inputFile: string, outputFile: string) {
    const pdfBuffer = await Bun.file(inputFile).arrayBuffer();
    const text = await pdf2md(pdfBuffer);
    Bun.file(outputFile).write(text);
}