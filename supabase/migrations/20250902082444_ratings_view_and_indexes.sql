-- Глобальный рейтинг: участники (user или guest) и их очки из завершённых турниров
create or replace view public.global_player_ratings_v1 as
with base as (
  select
    tp.tournament_id,
    case
      when tp.user_id is not null then 'user:' || tp.user_id::text
      else 'guest:' || coalesce(nullif(trim(tp.guest_name), ''), 'unknown')
    end as player_key,
    coalesce(cm.nickname, cm.full_name, tp.guest_name, 'Unknown') as display_name,
    coalesce(tp.rating_points, 0)::int as rating_points
  from public.tournament_participants tp
  join public.tournaments t on t.id = tp.tournament_id
  left join public.club_members cm on cm.user_id = tp.user_id
  where t.status = 'completed'
)
select
  player_key,
  display_name,
  count(distinct tournament_id)::int as tournaments_played,
  sum(case when rating_points > 0 then 1 else 0 end)::int as cashes,
  sum(rating_points)::int as total_points
from base
group by player_key, display_name;

comment on view public.global_player_ratings_v1
  is 'Aggregated rating totals for members and guests from completed tournaments.';
