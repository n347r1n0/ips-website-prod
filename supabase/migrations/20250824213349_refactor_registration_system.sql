-- ---
-- Миграция схемы для интеграции с десктоп-приложением
-- ---

-- Шаг 1: Переименовываем `guest_registrations` в `tournament_participants`
-- Это сохранит все ваши существующие данные о регистрациях гостей.
ALTER TABLE "public"."guest_registrations"
RENAME TO "tournament_participants";

-- Шаг 2: Добавляем новые столбцы в нашу переименованную таблицу
ALTER TABLE "public"."tournament_participants"
ADD COLUMN "player_id" UUID, -- Для связи с club_members
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'registered', -- Статус участника, по умолчанию 'registered'
ADD COLUMN "final_place" INTEGER; -- Итоговое место

-- Шаг 3: Устанавливаем связь (Foreign Key) с таблицей `club_members`
-- Это позволит нам связывать участников с их профилями в клубе.
ALTER TABLE "public"."tournament_participants"
ADD CONSTRAINT "tournament_participants_player_id_fkey"
FOREIGN KEY ("player_id")
REFERENCES "public"."club_members" ("user_id")
ON DELETE SET NULL; -- Важно: если профиль игрока удалят, его регистрация не удалится, а просто станет "гостевой" (player_id станет NULL)

-- Шаг 4: Добавляем поле для настроек таймера в таблицу `tournaments`
ALTER TABLE "public"."tournaments"
ADD COLUMN "settings_json" JSONB;

-- Шаг 5: Включаем защиту на уровне строк (RLS) для новой таблицы
-- Это ОБЯЗАТЕЛЬНЫЙ шаг для безопасности.
ALTER TABLE "public"."tournament_participants" ENABLE ROW LEVEL SECURITY;

-- Шаг 6: Создаем базовые политики безопасности для новой таблицы
-- Политика №1: Разрешить всем аутентифицированным пользователям видеть список участников.
CREATE POLICY "Allow authenticated users to read participants"
ON "public"."tournament_participants" FOR SELECT
TO authenticated
USING (true);

-- Политика №2: Разрешить аутентифицированным пользователям (пока что) создавать и изменять участников.
-- ВАЖНО: В будущем это правило нужно будет ужесточить, чтобы изменять данные могли только администраторы или организаторы турнира!
CREATE POLICY "Allow modification for authenticated users"
ON "public"."tournament_participants" FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
