-- Добавляем столбец для типа турнира
ALTER TABLE "public"."tournaments"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Стандартный';

-- Добавляем столбец-флаг для важных событий
ALTER TABLE "public"."tournaments"
ADD COLUMN "is_major" BOOLEAN NOT NULL DEFAULT false;

-- Добавляем комментарии для ясности
COMMENT ON COLUMN "public"."tournaments"."type" IS 'Тип турнира (Стандартный, Рейтинговый и т.д.) для отображения в календаре.';
COMMENT ON COLUMN "public"."tournaments"."is_major" IS 'Флаг, указывающий, является ли турнир главным событием месяца.';
