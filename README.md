# Northwind 

An AI-powered system that ingests employee expense submissions (PDF, image, or text receipts), extracts line items via OCR, and produces a pre-review of each item: compliant, flagged, or ambiguous — with cited policy clauses and confidence scores.

---

## 1. Running Locally

### Technologies Used

- [Bun](https://bun.sh)
- MongoDB Atlas cluster (with vector search enabled)
- Google AI API key (for embeddings and LLM)

### Setup

- Policy documents should be placed in `data/policies`
- Receipts can be populated from `data/submissions`

```bash
# Install dependencies
bun i

# Seed employees from sample submissions
bun run scripts/insert-employees.ts

# Ingest policy documents into the vector store
bun run scripts/setup-db.ts
```

Start the server
```bash
bun run dev
```
The app serves at http://localhost:3000.
Environment variables
```
MONGODB_URI
MONGODB_DATABASE_NAME
MONGODB_COLLECTION_NAME
GOOGLE_API_KEY
EMBEDDING_MODEL
AUTH_USERNAME
AUTH_PASSWORD
```

## 2. Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Reviewer)                  │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌────────┐ │
│  │ Upload   │   │ Submit   │   │ History  │  │  Chat  │ │
│  │ Receipts │   │ Review   │   │ Browse   │  │ Policy │ │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘  └───┬────┘ │
└───────┼──────────────┼──────────────┼────────────┼──────┘
        │              │              │            │
        ▼              ▼              ▼            ▼
┌─────────────────────────────────────────────────────────┐
│                   Elysia Server (Bun)                   │
│                                                         │
│  GET  /api/receipts          — list receipts            │
│  POST /api/receipts          — receipt upload           │
│  POST /api/vision            — OCR / text extraction    │
│  POST /api/claims            — submit claim             │
│  GET  /api/employees         — list employees           │
│  POST /api/employees         — add employees            │
│  POST /api/login             — authentication           │
│  GET  /api/policies          — policy retrieval         │
│  GET  /api/chat              — ad-hoc policy Q&A        │
└──────────────────────────┬──────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌───────────────┐ ┌────────────┐ ┌──────────────┐
    │ MongoDB Atlas │ │ LLM        │ │ PaddleOCR    │
    │               │ │ Embeddings │ │              │
    │ - employees   │ │            │ │              │
    │ - receipts    │ │ (Gemini)   │ │ PDF→images   │
    │ - claims      │ │            │ │ OCR text     │
    │ - lineitems   │ │            │ │              │
    │ - policies    │ └────────────┘ └──────────────┘
    │   (vector)    │
    └───────────────┘
```

Data flow
1. Policy ingestion: Policy PDFs → pdf2md → markdown → RecursiveCharacterTextSplitter → gemini-embedding-2 embeddings → MongoDB Atlas vector store.
2. Receipt upload: User uploads PDF/image/text → server dispatches to the appropriate extractor → OCR text stored in Receipt documents.
3. Pre-review: Received text → LLM analysis against retrieved policy clauses → verdict per line item with reasoning, citations, and confidence.
4. Review: Finance reviewer sees line items with verdicts, overrides with comments, submits final claim.

## 3. Design Choices & Tradeoffs
### Vector Store
I chose MongoDB Atlas vector search with MMR (maximal marginal relevance, k=5) rather than a dedicated vector database (Pinecone, Weaviate) or hybrid search. This keeps the deployment simple — one cloud service handles both structured data (employees, claims) and semantic search (policies).
### Embeddings
Embeddings use gemini-embedding-2 (Google's latest embedding model) because it's included in the free tier of Google AI and produces competitive embeddings for its cost.
### OCR
I chose OCR for text extraction over an LLM because it is faster and deterministic. It is also cheaper.
### Elysia + Bun
I used Elysia and Bun because this is the full-stack TypeScript framework I can develop most efficiently with. Bun is batteries-included. Because of the relative immaturity of these libraries, I would not use these in a large-scale production setting.
### Chakra UI
Chakra offers a component library that's fast to assemble for the reviewer UI.

## 4. Cost
I would like to make a more accurate estimate using real-world benchmarks in a fully implemented version. However these are very conservative estimates.

Per line-item: ~1000 tokens in, ~100-300 tokens out
Per claim: ~10000 tokens in, ~1000-3000 tokens out
Gemini 2.5 Flash costs $0.30/1M tokens in and $2.50/1M tokens out.
Each claim would cost $0.0225 to process. Scaled up to 10000 claims a day is $105 per day.