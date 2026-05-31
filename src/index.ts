import staticPlugin from "@elysia/static";
import { jwt } from "@elysia/jwt";
import { Elysia, t } from "elysia";
import * as mongoose from "mongoose";
import { Employee } from "./models/employee";
import { Receipt } from "./models/receipt";
import { extractText } from "../scripts/process-receipt";

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
    .post("/vision", async ({ body, status }) => {
      const files = body.files
      if (!files || files.length === 0) {
        return status(400, "No files provided")
      }

      const results: Array<{ name: string; text: string }> = []
      for (const f of files) {
        try {
          const newFilePath = "data/upload/" + f.name
          const uploadedFile = Bun.file(newFilePath)
          await uploadedFile.write(await f.arrayBuffer())

          const text = await extractText(newFilePath)
          results.push({ name: f.name, text })
        } catch (err) {
          return status(500, "An error occurred while processing the receipts.")
        }
      }
      return { results }
    }, {
      body: t.Object({
        files: t.Files()
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