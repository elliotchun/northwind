import * as mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true },
);

export type EmployeeDoc = mongoose.InferSchemaType<typeof employeeSchema>;
export const Employee = mongoose.model("Employee", employeeSchema);
