-- Отменяем миграцию, которая добавила столбцы type и is_major
-- Используем IF EXISTS, чтобы скрипт не выдавал ошибку, если столбцы уже удалены

ALTER TABLE "public"."tournaments"
DROP COLUMN IF EXISTS "type";

ALTER TABLE "public"."tournaments"
DROP COLUMN IF EXISTS "is_major";
