import { useState } from 'react';
import { supabase } from './utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStoreDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const convId = uuidv4();
    const docId = uuidv4();

    // Create conversation
    await supabase.from('conversations').insert({ id: convId });

    // Create document
    await supabase.from('documents').insert({ id: docId });

    // Link conversation and document
    await supabase.from('conversation_documents').insert({
      conversation_id: convId,
      document_id: docId,
    });

    // Store document in vector DB
    await fetch('http://localhost:8080/store-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, documentId: docId }),
    });

    setConversationId(convId);
    setDocumentId(docId);
    setLoading(false);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newMessage: Message = { role: 'user', content: query };
    setMessages([...messages, newMessage]);

    const response = await fetch('http://localhost:8080/query-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        conversationId,
        documentIds: [documentId],
      }),
    });

    const data = await response.json();
    const aiMessage: Message = { role: 'assistant', content: data.answer };
    setMessages([...messages, newMessage, aiMessage]);
    setQuery('');
    setLoading(false);
  };

  return (
    <div className="App">
      <h1>AI Chat with YouTube</h1>

      {!conversationId ? (
        <form onSubmit={handleStoreDocument}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL"
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Process Video'}
          </button>
        </form>
      ) : (
        <>
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <form onSubmit={handleQuery}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default App;
