import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createSupabaseClient } from '../utils/supabase.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key';

export async function queryDocument(
  query: string,
  conversationId: string,
  documentIds: string[]
) {
  try {
    const supabase = createSupabaseClient();

    // Store user query
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: query,
    });

    // Get conversation history (last 14 messages)
    const { data: messages } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(14);

    // Format chat history as text
    const chatHistory = messages
      ?.reverse()
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n') || 'No previous conversation';

    // Initialize embeddings
    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      openAIApiKey: OPENAI_API_KEY,
    });

    // Initialize vector store with filter
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'embedded_documents',
      queryName: 'match_documents',
      filter: { document_ids: documentIds },
    });

    // Retrieve relevant documents from vector database
    const relevantDocs = await vectorStore.similaritySearch(query, 10);
    
    // Combine document content into context
    const context = relevantDocs
      .map((doc) => doc.pageContent)
      .join('\n\n---\n\n');

    // Create prompt template
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided YouTube video content.

Context from YouTube video:
{context}

Previous conversation:
{chat_history}

Current question: {question}

Please provide a detailed and accurate answer based on the context above. If the answer is not in the context, say so.

Answer:`);

    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      openAIApiKey: OPENAI_API_KEY,
      temperature: 0.7,
    });

    // Create chain using RunnableSequence
    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    // Invoke the chain
    const answer = await chain.invoke({
      context: context,
      chat_history: chatHistory,
      question: query,
    });

    // Store AI response
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: answer,
    });

    return { ok: true, answer: answer };
  } catch (error) {
    console.error('Error in queryDocument:', error);
    return { ok: false, error: String(error) };
  }
}
