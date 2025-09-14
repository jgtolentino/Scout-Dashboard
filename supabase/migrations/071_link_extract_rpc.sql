-- One button: link face→txn + extract brands; returns counts
create or replace function public.link_and_extract_rpc(p_window_seconds int default 90)
returns json
language plpgsql
security definer
as $$
declare v_linked int:=0; v_extracted int:=0;
begin
  -- run match & extract
  select analytics.match_face_events_to_txn(p_window_seconds) into v_linked;
  select analytics.extract_brands_for_new_segments() into v_extracted;

  return json_build_object('linked', v_linked, 'extracted', v_extracted);
end $$;

-- Hard lock: only service_role can call
revoke all on function public.link_and_extract_rpc(int) from public, anon, authenticated;
grant execute on function public.link_and_extract_rpc(int) to service_role;

-- Optional individual wrappers (handy for CI/smoke)
create or replace function public.face_match_rpc(p_window_seconds int default 90)
returns int language sql security definer
as $$ select analytics.match_face_events_to_txn(p_window_seconds) $$;

create or replace function public.brand_extract_rpc()
returns int language sql security definer
as $$ select analytics.extract_brands_for_new_segments() $$;

revoke all on function public.face_match_rpc(int) from public, anon, authenticated;
revoke all on function public.brand_extract_rpc() from public, anon, authenticated;
grant execute on function public.face_match_rpc(int) to service_role;
grant execute on function public.brand_extract_rpc() to service_role;