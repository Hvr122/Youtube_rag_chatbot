import { Request } from "express";
import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createSupabaseClient } from '../utils/supabase.js';
import { request } from "http";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function storeDocument(req: Request) {


try {   
    const {url,documentId}=req.body;

// initialize superbase client 
const supabase = createSupabaseClient();
//initialize embedding model
const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large',
      apiKey: OPENAI_API_KEY,
    });
// Initialize vector store
 const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'embedded_documents',
      queryName: 'match_documents',
    });
// Load YouTube transcript
const loader = YoutubeLoader.createFromUrl(url, {
      addVideoInfo: true,
    });
    const docs = await loader.load();
    console.log(docs)
// Add video title to content
docs[0].pageContent = `Video Title: ${docs[0].metadata.title}\n\nVideo Content: ${docs[0].pageContent}`;

// Split documents into chunks
const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
 const texts = await textSplitter.splitDocuments(docs);
 console.log(texts)
// Add metadata

const docsWithMetadata = texts.map((text) => ({
      ...text,
      metadata: {
        ...text.metadata,
         documentId,
      },
    }));
//Store in vector database
await vectorStore.addDocuments(docsWithMetadata);
  return { ok: true };
}
 catch (error) {
    console.error(error);
    return { ok: false };
  }
}



