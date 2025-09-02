// supabase/functions/telegram-auth-callback/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// ---------- CORS ----------
const ALLOW_ORIGINS = [
  'https://www.ipoker.style',
  'https://ips-entertain.xyz',
  'http://localhost:5173',
]
function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOW_ORIGINS.includes(origin) ? origin : '*'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
const json = (req: Request, body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    ...init,
  })

// ---------- Telegram hash verify ----------
async function verifyTelegramHash(userData: any, botToken: string): Promise<boolean> {
  const { hash, ...dataToCheck } = userData
  const checkString = Object.keys(dataToCheck)
    .sort()
    .map((k) => `${k}=${dataToCheck[k]}`)
    .join('\n')

  const secretKeyData = new TextEncoder().encode(botToken)
  const secretKey = await crypto.subtle.digest('SHA-256', secretKeyData)
  const key = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(checkString))
  const hex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex === hash
}

// минутная защита от реплея (по желанию)
function isFreshAuth(auth_date?: number, maxAgeSec = 300) {
  if (!auth_date) return false
  const now = Math.floor(Date.now() / 1000)
  return now - auth_date <= maxAgeSec
}

// ---------- Password grant ----------
async function passwordGrant(email: string, password: string) {
  const url = `${Deno.env.get('SUPABASE_URL')}/auth/v1/token?grant_type=password`
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  return fetch(url, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })

  try {
    const body = await req.json().catch(() => ({}))
    const DEBUG = Deno.env.get('DEBUG_TELEGRAM_BYPASS') === 'true'

    let tg: any = body?.tgUserData
    if (!tg && DEBUG && body?.debug?.id) {
      console.log('--- DEBUG MODE: telegram bypass ---')
      tg = {
        id: body.debug.id,
        username: body.debug.username ?? 'debuguser',
        first_name: body.debug.first_name ?? 'Debug',
        last_name: body.debug.last_name ?? 'User',
        photo_url: null,
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'DEBUG_BYPASS',
      }
    }
    if (!tg) return json(req, { success: false, error: 'Отсутствуют данные авторизации Telegram.' }, { status: 400 })

    const telegramId = Number(tg.id)
    if (!telegramId) return json(req, { success: false, error: 'Невалидный Telegram ID.' }, { status: 400 })

    // — prod-безопасность —
    if (!DEBUG) {
      const botToken = Deno.env.get('TELEGRAM_CLIENT_SECRET')
      if (!botToken) return json(req, { success: false, error: 'Нет TELEGRAM_CLIENT_SECRET.' }, { status: 500 })
      if (!isFreshAuth(tg.auth_date)) {
        return json(req, { success: false, error: 'Просроченные данные авторизации.' }, { status: 401 })
      }
      const ok = await verifyTelegramHash(tg, botToken)
      if (!ok) return json(req, { success: false, error: 'Ошибка проверки подписи Telegram.' }, { status: 401 })
    }

    const SHADOW = Deno.env.get('SHADOW_PASSWORD_SECRET')
    if (!SHADOW) return json(req, { success: false, error: 'Нет SHADOW_PASSWORD_SECRET.' }, { status: 500 })

    const email = `tg_${telegramId}@telegram.user`
    const password = `${SHADOW}:${telegramId}`

    // 1) пробуем войти (если уже есть)
    let res = await passwordGrant(email, password)
    if (res.ok) {
      const tokens = await res.json()
      return json(req, { success: true, session_token: tokens })
    }

    // 2) создаём пользователя и повторяем вход
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const fullName = `${tg.first_name || ''} ${tg.last_name || ''}`.trim()
    const metadata = {
      provider: 'telegram',
      telegram_id: telegramId,
      username: tg.username ?? null,
      full_name: fullName || null,
      avatar_url: tg.photo_url ?? null,
      nickname: tg.username || tg.first_name || `tg_${telegramId}`,
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    })

    if (createErr) {
      // возможна ситуация «пользователь уже есть» — просто идём дальше к логину
      console.warn('createUser error:', createErr.message || createErr)
    } else {
      console.log('user created:', created.user?.id)
    }

    res = await passwordGrant(email, password)
    if (!res.ok) {
      const text = await res.text()
      return json(
        req,
        { success: false, error: `Password grant failed: ${res.status} ${text}` },
        { status: 500 }
      )
    }

    const tokens = await res.json()
    return json(req, { success: true, session_token: tokens })
  } catch (e: any) {
    console.error('Telegram Auth Failed:', e?.message || e)
    return json(req, { success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
})
