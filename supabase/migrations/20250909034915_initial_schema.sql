SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE r text;
BEGIN
  SELECT role INTO r
  FROM public.club_members
  WHERE user_id = auth.uid();
  RETURN r;
END;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO public.club_members (
    user_id, nickname, full_name, avatar_url, telegram_id, telegram_username
  )
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'nickname',''),
    NULLIF(NEW.raw_user_meta_data->>'full_name',''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url',''),
    NULLIF(NEW.raw_user_meta_data->>'telegram_id','')::BIGINT,
    NULLIF(NEW.raw_user_meta_data->>'username','')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    nickname          = COALESCE(EXCLUDED.nickname, public.club_members.nickname),
    full_name         = COALESCE(EXCLUDED.full_name, public.club_members.full_name),
    avatar_url        = COALESCE(EXCLUDED.avatar_url, public.club_members.avatar_url),
    telegram_id       = COALESCE(EXCLUDED.telegram_id, public.club_members.telegram_id),
    telegram_username = COALESCE(EXCLUDED.telegram_username, public.club_members.telegram_username),
    updated_at        = timezone('utc', now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."club_members" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "telegram_id" bigint,
    "telegram_username" "text",
    "full_name" "text",
    "nickname" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    CONSTRAINT "club_members_telegram_id_positive" CHECK ((("telegram_id" IS NULL) OR ("telegram_id" > 0)))
);


ALTER TABLE "public"."club_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."club_members" IS 'Профили участников клуба (расширение auth.users).';



COMMENT ON COLUMN "public"."club_members"."role" IS 'Роль пользователя в системе (например, member, admin).';



CREATE TABLE IF NOT EXISTS "public"."tournament_participants" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "telegram_id" bigint,
    "guest_name" "text",
    "tournament_id" bigint NOT NULL,
    "player_id" "uuid",
    "status" "text" DEFAULT 'registered'::"text" NOT NULL,
    "final_place" integer,
    "guest_contact" "text",
    "rating_points" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."tournament_participants" OWNER TO "postgres";


COMMENT ON TABLE "public"."tournament_participants" IS 'Quick Registrations through tg';



CREATE TABLE IF NOT EXISTS "public"."tournaments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "tournament_date" timestamp with time zone,
    "is_active_for_registration" boolean,
    "settings_json" "jsonb",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "is_major" boolean DEFAULT false,
    "tournament_type" "text" DEFAULT 'Стандартный'::"text",
    CONSTRAINT "tournament_type_valid" CHECK (("tournament_type" = ANY (ARRAY['Стандартный'::"text", 'Специальный'::"text", 'Фриролл'::"text", 'Рейтинговый'::"text"]))),
    CONSTRAINT "valid_tournament_status" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'registration_open'::"text", 'late_registration'::"text", 'live_no_registration'::"text", 'completed'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."tournaments" OWNER TO "postgres";


COMMENT ON TABLE "public"."tournaments" IS 'Overall information about Events';



CREATE OR REPLACE VIEW "public"."global_player_points_v1" AS
 SELECT "tp"."player_id",
    ("sum"("tp"."rating_points"))::integer AS "total_points"
   FROM ("public"."tournament_participants" "tp"
     JOIN "public"."tournaments" "t" ON (("t"."id" = "tp"."tournament_id")))
  WHERE (("t"."status" = 'completed'::"text") AND ("tp"."player_id" IS NOT NULL))
  GROUP BY "tp"."player_id";


ALTER VIEW "public"."global_player_points_v1" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."global_player_ratings_v1" AS
 SELECT "tp"."player_id",
    "cm"."nickname",
    "cm"."avatar_url",
    ("sum"("tp"."rating_points"))::integer AS "total_points",
    "count"(*) FILTER (WHERE ("tp"."final_place" IS NOT NULL)) AS "events_count",
    "max"("t"."tournament_date") AS "last_played"
   FROM (("public"."tournament_participants" "tp"
     JOIN "public"."tournaments" "t" ON (("t"."id" = "tp"."tournament_id")))
     LEFT JOIN "public"."club_members" "cm" ON (("cm"."user_id" = "tp"."player_id")))
  WHERE (("t"."status" = 'completed'::"text") AND ("tp"."player_id" IS NOT NULL))
  GROUP BY "tp"."player_id", "cm"."nickname", "cm"."avatar_url";


ALTER VIEW "public"."global_player_ratings_v1" OWNER TO "postgres";


ALTER TABLE "public"."tournament_participants" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."guest_registrations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."tournaments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tournaments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_telegram_id_key" UNIQUE ("telegram_id");



ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."tournament_participants"
    ADD CONSTRAINT "guest_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "idx_club_members_tg_id" ON "public"."club_members" USING "btree" ("telegram_id");



CREATE INDEX "idx_club_members_tg_username_ci" ON "public"."club_members" USING "btree" ("lower"("telegram_username"));



CREATE INDEX "idx_t_status_date" ON "public"."tournaments" USING "btree" ("status", "tournament_date");



CREATE INDEX "idx_tournaments_date" ON "public"."tournaments" USING "btree" ("tournament_date");



CREATE INDEX "idx_tournaments_major" ON "public"."tournaments" USING "btree" ("is_major") WHERE ("is_major" = true);



CREATE INDEX "idx_tournaments_type" ON "public"."tournaments" USING "btree" ("tournament_type");



CREATE INDEX "idx_tp_player" ON "public"."tournament_participants" USING "btree" ("player_id");



CREATE INDEX "idx_tp_tournament" ON "public"."tournament_participants" USING "btree" ("tournament_id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."club_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_participants"
    ADD CONSTRAINT "guest_registrations_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id");



ALTER TABLE ONLY "public"."tournament_participants"
    ADD CONSTRAINT "tournament_participants_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."club_members"("user_id") ON DELETE SET NULL;



CREATE POLICY "Allow anonymous registration" ON "public"."tournament_participants" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to read participants" ON "public"."tournament_participants" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read their own profile" ON "public"."club_members" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to update their own profile" ON "public"."club_members" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow modification for authenticated users" ON "public"."tournament_participants" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Disallow direct insert by users" ON "public"."club_members" FOR INSERT TO "authenticated" WITH CHECK (false);



ALTER TABLE "public"."club_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournaments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tournaments_delete_admin" ON "public"."tournaments" FOR DELETE USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "tournaments_insert_admin" ON "public"."tournaments" FOR INSERT WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "tournaments_select_all" ON "public"."tournaments" FOR SELECT USING (true);



CREATE POLICY "tournaments_update_admin" ON "public"."tournaments" FOR UPDATE USING (("public"."get_user_role"() = 'admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."get_user_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."club_members" TO "anon";
GRANT ALL ON TABLE "public"."club_members" TO "authenticated";
GRANT ALL ON TABLE "public"."club_members" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_participants" TO "anon";
GRANT ALL ON TABLE "public"."tournament_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_participants" TO "service_role";



GRANT ALL ON TABLE "public"."tournaments" TO "anon";
GRANT ALL ON TABLE "public"."tournaments" TO "authenticated";
GRANT ALL ON TABLE "public"."tournaments" TO "service_role";



GRANT ALL ON TABLE "public"."global_player_points_v1" TO "anon";
GRANT ALL ON TABLE "public"."global_player_points_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."global_player_points_v1" TO "service_role";



GRANT ALL ON TABLE "public"."global_player_ratings_v1" TO "anon";
GRANT ALL ON TABLE "public"."global_player_ratings_v1" TO "authenticated";
GRANT ALL ON TABLE "public"."global_player_ratings_v1" TO "service_role";



GRANT ALL ON SEQUENCE "public"."guest_registrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."guest_registrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."guest_registrations_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tournaments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tournaments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tournaments_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
