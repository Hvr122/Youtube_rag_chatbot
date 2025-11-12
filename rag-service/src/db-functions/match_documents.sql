create or replace function match_documents (
  query_embedding vector(3072),
  match_count int default 10,
  filter jsonb default '{}'
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    embedded_documents.id,
    embedded_documents.content,
    embedded_documents.metadata,
    1 - (embedded_documents.embedding <=> query_embedding) as similarity
  from embedded_documents
  where 
    (filter->>'document_ids' is null or 
     embedded_documents.document_id = any(
       select jsonb_array_elements_text(filter->'document_ids')::uuid
     ))
  order by embedded_documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
