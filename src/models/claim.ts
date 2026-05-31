import * as mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    item_name: { type: String, required: true },
    spending_category: { type: String, required: true },
    verdict: { type: String, enum: ["accepted", "rejected"], default: "accepted" },
    reason: { type: String, default: "" },
    confidence: { type: Number, enum: [-1, 0, 1], default: 0 },
  },
  { timestamps: true },
);

const claimSchema = new mongoose.Schema(
  {
    receiptIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Receipt" }],
    lineItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "LineItem" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type LineItemDoc = mongoose.InferSchemaType<typeof lineItemSchema>;
export type ClaimDoc = mongoose.InferSchemaType<typeof claimSchema>;
export const LineItem = mongoose.model("LineItem", lineItemSchema);
export const Claim = mongoose.model("Claim", claimSchema);
