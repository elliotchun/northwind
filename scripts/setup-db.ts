import { MongoDBAtlasVectorSearch } from "@langchain/mongodb"
import { MongoClient } from "mongodb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { readdir } from "node:fs/promises"
import { convertPdfToMarkdown } from "./process-policy-doc";
import { parseArgs } from "node:util";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const { values, positionals } = parseArgs({
    args: Bun.argv,
    allowPositionals: true,
});

if (positionals.length < 2) {
    console.error("Policy directory not provided!");
    process.exit(1);
}
const dir = positionals[2]!;

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: process.env.EMBEDDING_MODEL!,
});

// Connect to the database
const client = new MongoClient(process.env.MONGODB_URI!);
await client.connect();

const collection = client
    .db(process.env.MONGODB_DB_NAME!)
    .collection(process.env.MONGODB_COLLECTION_NAME!);

const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
});

// For each policy document pdf, parse it to markdown
// Load each markdown file to Document, then add them to the vector store
const files = (await readdir(dir)).filter(file => file.endsWith(".pdf"));
const documents = [];

for (const fileName of files) {
    console.log(fileName)
    const resultFileName = `${fileName.slice(0, -4)}.md`;
    await convertPdfToMarkdown(dir + fileName, dir + resultFileName)
    const policyDocument = Bun.file(dir + resultFileName);

    // Split the document
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const doc = new Document({
        pageContent: await policyDocument.text(),
        metadata: {
            source: fileName,
        },
    });

    const splitDocs = await splitter.splitDocuments([
        doc,
    ]);

    // Add them to the documents array
    documents.push(...splitDocs);
}


await vectorStore.addDocuments(documents);

const results = vectorStore.asRetriever({
    searchType: "mmr",
    k: 5,
});

const docs = await results.invoke("Food policy");

console.log(docs)
await client.close();