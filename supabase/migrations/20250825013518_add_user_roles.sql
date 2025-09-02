-- Добавляем столбец для хранения роли пользователя
ALTER TABLE "public"."club_members"
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'member';

-- Добавляем комментарий
COMMENT ON COLUMN "public"."club_members"."role" IS 'Роль пользователя в системе (например, member, admin).';
