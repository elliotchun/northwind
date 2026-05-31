import { PaddleOcrService } from "ppu-paddle-ocr";
import { parseArgs } from "util";
import { pdf } from "pdf-to-img";

const SUPPORTED_FORMATS = {
    "image": [
        "jpg",
        "jpeg",
        "png",
    ],
    "pdf": [
        "pdf",
    ],
    "text": [
        "txt",
        "md",
    ],
}

const SUPPORTED_FORMATS_FLAT = Array.from(Object.values(SUPPORTED_FORMATS)).flat();

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
    if (!SUPPORTED_FORMATS_FLAT.some(extension => path.endsWith(extension))) {
        console.error("Unsupported file extension.");
        process.exit(1);
    }

    console.log(await extractText(path));
}

export async function extractText(filePath: string) {
    let result = "";

    if (SUPPORTED_FORMATS.pdf.some(extension => filePath.endsWith(extension))) { // pdf
        const document = await pdf(filePath);
        const service = new PaddleOcrService({
            debugging: {
                debug: false,
                verbose: true,
            },
        });

        await service.initialize();

        for await (const image of document) {
            const ocr = await service.recognize(image.buffer as ArrayBuffer);
            result += ocr.text;
        }

        await service.destroy();
    }
    else if (SUPPORTED_FORMATS.image.some(extension => filePath.endsWith(extension))) { // Image
        const service = new PaddleOcrService({
            debugging: {
                debug: false,
                verbose: true,
            },
        });

        await service.initialize();

        const ocr = await service.recognize(await Bun.file(filePath).arrayBuffer());
        result = ocr.text;

        await service.destroy();
    }
    else if (SUPPORTED_FORMATS.text.some(extension => filePath.endsWith(extension))) { // Text
        result = await Bun.file(filePath).text();
    }

    return result;
}

