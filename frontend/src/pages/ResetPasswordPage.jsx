// frontend/src/pages/ResetPasswordPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Section } from '@/components/layout/Section';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle } from 'lucide-react';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Этот useEffect проверяет наличие access_token при заходе на страницу
  // Если его нет, значит пользователь попал сюда случайно
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Supabase автоматически обрабатывает токен из URL и создает сессию
        // Нам не нужно ничего делать, просто позволяем пользователю ввести новый пароль
      } else if (!session) {
        setError('Неверная или устаревшая ссылка для сброса пароля.');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);
    // Функция updateUser обновляет пароль для текущей сессии
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Через 3 секунды перенаправляем на главную
      setTimeout(() => navigate('/'), 3000);
    }
  };

  if (success) {
    return (
      <Section>
        <div className="max-w-md mx-auto text-center">
          <GlassPanel>
            <div className="p-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-brand text-white mb-2">Пароль успешно изменен!</h1>
              <p className="text-white/70">Вы будете перенаправлены на главную страницу через 3 секунды.</p>
            </div>
          </GlassPanel>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="max-w-md mx-auto">
        <GlassPanel>
          <div className="p-8">
            <h1 className="text-3xl font-brand text-center text-white mb-6 gold-highlight">Создайте новый пароль</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label htmlFor="password">Новый пароль *</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 border-white/20 focus:ring-deep-teal"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="confirmPassword">Подтвердите пароль *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 border-white/20 focus:ring-deep-teal"
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm text-center rounded-lg p-3">
                  {error}
                </div>
              )}

  <Button type="submit" disabled={loading} className="luxury-button w-full py-3 text-lg rounded-xl">
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Сохранить новый пароль"}
              </Button>
            </form>
          </div>
        </GlassPanel>
      </div>
    </Section>
  );
}
