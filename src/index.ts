import staticPlugin from "@elysia/static";
import { Elysia, t } from "elysia";
import * as mongoose from "mongoose";
import { Employee } from "./models/employee";
import { Receipt } from "./models/receipt";

await mongoose.connect(process.env.MONGODB_URI!);

const app = new Elysia()
  .use(staticPlugin({
    assets: 'src/client/pages/',
    bunFullstack: true,
    prefix: '/',
  }))
  .group('api/', app => app
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
