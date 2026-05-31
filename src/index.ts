import staticPlugin from "@elysia/static";
import { jwt } from "@elysia/jwt";
import { Elysia, t } from "elysia";
import * as mongoose from "mongoose";
import { PaddleOcrService } from "ppu-paddle-ocr";
import { pdf } from "pdf-to-img";
import { Employee } from "./models/employee";
import { Receipt } from "./models/receipt";

await mongoose.connect(process.env.MONGODB_URI!);

const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET!,
    })
  )
  .use(staticPlugin({
    assets: './src/client/pages/',
    bunFullstack: true,
    prefix: '/'
  }))
  .post("/api/login", async ({ jwt, body, status, cookie: { auth } }) => {
    const { username, password } = body;
    if (username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD) {
      const value = await jwt.sign({ username })
      auth?.set({
        value,
        httpOnly: true,
        maxAge: 7 * 86400,
      })
      return status(200, 'Ok')
    }

    return status(401, 'Invalid credentials')
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    })
  })
  .group('api', app => app
    .get("/receipts", async () => {
      const receipts = await Receipt.find()
        .populate("employee")
        .lean();
      return receipts;
    })
    .post("/receipts", async ({ body }) => {
      const receipt = await Receipt.create({
        employee: body.employeeId,
        text: body.text ?? [],
      });
      const populated = await receipt.populate("employee");
      return populated.toObject();
    }, {
      body: t.Object({
        employeeId: t.String(),
        text: t.Optional(t.Array(t.String())),
      }),
    })
    .post("/receipts/upload", async ({ file, body, status }) => {
      const files = file("files");
      if (!files || files.length === 0) {
        return status(400, "No files provided");
      }

      const employeeId = body.employeeId;
      let employee = null;
      if (employeeId) {
        employee = await Employee.findById(employeeId);
        if (!employee) {
          return status(404, "Employee not found");
        }
      }

      const results = [];
      for (const f of files) {
        try {
          const text = await extractTextFromUpload(f);
          const textLines = text
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

          if (textLines.length === 0) {
            results.push({ name: f.data?.name ?? "unknown", status: "skipped", reason: "no text extracted" });
            continue;
          }

          const receipt = await Receipt.create({
            employee: employee?._id,
            text: textLines,
          });
          results.push({ name: f.data?.name ?? "unknown", status: "ok", receiptId: receipt._id.toString() });
        } catch (err) {
          results.push({ name: f.data?.name ?? "unknown", status: "error", reason: err instanceof Error ? err.message : String(err) });
        }
      }

      return { processed: results };
    }, {
      body: t.Object({
        employeeId: t.Optional(t.String()),
      }),
      form: t.Files({
        maxFiles: 50,
        maxFileSize: "50mb",
      }),
    })
    .get("/receipts/:id", async ({ params }) => {
      const receipt = await Receipt.findById(params.id)
        .populate("employee")
        .lean();
      if (!receipt) {
        return { error: "Receipt not found" };
      }
      return receipt;
    }, {
      params: t.Object({
        id: t.String(),
      }),
    })
    .get("/employees", async () => {
      const employees = await Employee.find().lean();
      return employees;
    })
    .post("/employees", async ({ body }) => {
      const employee = await Employee.create({
        name: body.name,
      });
      return employee.toObject();
    }, {
      body: t.Object({
        name: t.String(),
      }),
    })
    .get("/employees/:id", async ({ params }) => {
      const employee = await Employee.findById(params.id).lean();
      if (!employee) {
        return { error: "Employee not found" };
      }
      return employee;
    }, {
      params: t.Object({
        id: t.String(),
      }),
    })
  )
  .listen(3000);


console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

async function extractTextFromUpload(file: { data: { name?: string; type?: string; path?: string } | null }): Promise<string> {
  const name = file.data?.name ?? "";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  let result = "";

  if (ext === "pdf") {
    const filePath = file.data?.path;
    if (!filePath) throw new Error("No file path available");
    const document = await pdf(filePath);
    const service = new PaddleOcrService({
      debugging: { debug: false, verbose: false },
    });
    await service.initialize();
    for await (const image of document) {
      const ocr = await service.recognize(image.buffer as ArrayBuffer);
      result += ocr.text;
    }
    await service.destroy();
  } else if (["jpg", "jpeg", "png"].includes(ext)) {
    const filePath = file.data?.path;
    if (!filePath) throw new Error("No file path available");
    const service = new PaddleOcrService({
      debugging: { debug: false, verbose: false },
    });
    await service.initialize();
    const ocr = await service.recognize(await Bun.file(filePath).arrayBuffer());
    result = ocr.text;
    await service.destroy();
  } else if (["txt", "md"].includes(ext)) {
    result = await Bun.file(file.data?.path!).text();
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  return result;
}
