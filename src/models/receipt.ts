import * as mongoose from "mongoose";
import { Employee } from "./employee";

const receiptSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    text: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type ReceiptDoc = mongoose.InferSchemaType<typeof receiptSchema>;
export const Receipt = mongoose.model("Receipt", receiptSchema);
