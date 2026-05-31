import * as mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    employee_id: { type: String, required: true },
    grade: { type: Number, required: true },
    title: { type: String, required: true },
    department: { type: String, required: true },
    home_base: { type: String, required: true },
  },
  { timestamps: true },
);

export type EmployeeDoc = mongoose.InferSchemaType<typeof employeeSchema>;
export const Employee = mongoose.model("Employee", employeeSchema);
