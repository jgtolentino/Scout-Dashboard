-- Enable pgmq for async job queues
create extension if not exists pgmq;

-- Create queues for different types of async work
select pgmq.create_queue('embeddings');     -- Text embedding processing
select pgmq.create_queue('data_ingestion'); -- File/data ingestion jobs
select pgmq.create_queue('notifications');  -- Email/Slack notifications
select pgmq.create_queue('exports');        -- Large data exports

-- Queue management schema
create schema if not exists queues;

-- Helper function to enqueue embedding work (service_role only)
create or replace function queues.enqueue_embedding(
  doc_id uuid,
  content text,
  org_id uuid default null,
  metadata jsonb default '{}'::jsonb
)
returns bigint 
language sql 
security definer 
as $$
  select pgmq.send(
    'embeddings', 
    json_build_object(
      'doc_id', doc_id::text,
      'content', content,
      'org_id', coalesce(org_id::text, 'null'),
      'metadata', metadata,
      'created_at', now()::text,
      'priority', 'normal'
    )::jsonb
  );
$$;

-- Helper function to enqueue data ingestion (service_role only)
create or replace function queues.enqueue_ingestion(
  source_type text,
  source_path text,
  org_id uuid,
  config jsonb default '{}'::jsonb
)
returns bigint 
language sql 
security definer 
as $$
  select pgmq.send(
    'data_ingestion',
    json_build_object(
      'source_type', source_type,
      'source_path', source_path, 
      'org_id', org_id::text,
      'config', config,
      'created_at', now()::text,
      'priority', 'normal'
    )::jsonb
  );
$$;

-- Helper function to enqueue notifications (service_role only)
create or replace function queues.enqueue_notification(
  notification_type text,
  recipient text,
  subject text,
  message text,
  metadata jsonb default '{}'::jsonb
)
returns bigint 
language sql 
security definer 
as $$
  select pgmq.send(
    'notifications',
    json_build_object(
      'type', notification_type,
      'recipient', recipient,
      'subject', subject,
      'message', message,
      'metadata', metadata,
      'created_at', now()::text,
      'priority', 'normal'
    )::jsonb
  );
$$;

-- Helper function to enqueue exports (service_role only)  
create or replace function queues.enqueue_export(
  export_type text,
  query_params jsonb,
  org_id uuid,
  requested_by uuid,
  format text default 'csv'
)
returns bigint 
language sql 
security definer 
as $$
  select pgmq.send(
    'exports',
    json_build_object(
      'export_type', export_type,
      'query_params', query_params,
      'org_id', org_id::text,
      'requested_by', requested_by::text,
      'format', format,
      'created_at', now()::text,
      'priority', 'normal'
    )::jsonb
  );
$$;

-- Queue monitoring view
create or replace view queues.queue_stats as
select 
  queue_name,
  queue_length,
  newest_msg_age_sec,
  oldest_msg_age_sec,
  total_messages
from pgmq.metrics_all()
order by queue_name;

-- Dead letter queue management
create or replace function queues.setup_dlq(queue_name text)
returns void
language sql
security definer
as $$
  select pgmq.create_queue(queue_name || '_dlq');
$$;

-- Initialize dead letter queues
select queues.setup_dlq('embeddings');
select queues.setup_dlq('data_ingestion');
select queues.setup_dlq('notifications');
select queues.setup_dlq('exports');

-- Function to move failed messages to DLQ
create or replace function queues.move_to_dlq(
  source_queue text,
  message_id bigint,
  error_details jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
as $$
declare
  msg_content jsonb;
  dlq_name text;
begin
  -- Get the original message
  select message into msg_content 
  from pgmq.read(source_queue, 1, 1) 
  where msg_id = message_id;
  
  if msg_content is null then
    return false;
  end if;
  
  dlq_name := source_queue || '_dlq';
  
  -- Add error information to message
  msg_content := msg_content || jsonb_build_object(
    'original_queue', source_queue,
    'failed_at', now(),
    'error_details', error_details,
    'original_msg_id', message_id
  );
  
  -- Send to DLQ
  perform pgmq.send(dlq_name, msg_content);
  
  -- Delete from original queue
  perform pgmq.delete(source_queue, message_id);
  
  return true;
exception
  when others then
    raise notice 'Failed to move message % from % to DLQ: %', message_id, source_queue, SQLERRM;
    return false;
end $$;

-- Secure the queue functions
revoke all on function queues.enqueue_embedding(uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function queues.enqueue_ingestion(text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function queues.enqueue_notification(text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function queues.enqueue_export(text, jsonb, uuid, uuid, text) from public, anon, authenticated;
revoke all on function queues.setup_dlq(text) from public, anon, authenticated;
revoke all on function queues.move_to_dlq(text, bigint, jsonb) from public, anon, authenticated;

grant execute on function queues.enqueue_embedding(uuid, text, uuid, jsonb) to service_role;
grant execute on function queues.enqueue_ingestion(text, text, uuid, jsonb) to service_role;
grant execute on function queues.enqueue_notification(text, text, text, text, jsonb) to service_role;
grant execute on function queues.enqueue_export(text, jsonb, uuid, uuid, text) to service_role;
grant execute on function queues.setup_dlq(text) to service_role;
grant execute on function queues.move_to_dlq(text, bigint, jsonb) to service_role;

-- Grant access to queue monitoring
grant usage on schema queues to service_role;
grant select on queues.queue_stats to service_role;