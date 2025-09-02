    -- Добавляем индекс на поле tournament_date для ускорения выборок по диапазону дат.
    -- Это рекомендованная практика для полей, которые часто используются в фильтрации (WHERE ... gte/lte).
    CREATE INDEX IF NOT EXISTS idx_tournaments_date
    ON public.tournaments(tournament_date);
