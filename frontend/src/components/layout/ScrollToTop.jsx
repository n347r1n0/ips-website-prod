// src/components/layout/ScrollToTop.jsx

// 1. Импортируем хуки из React и react-router-dom
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 2. Создаем компонент
export function ScrollToTop() {
  // 3. Получаем доступ к информации о текущем URL
  const { pathname } = useLocation();

  // 4. Используем useEffect, чтобы выполнять действие КАЖДЫЙ РАЗ,
  //    когда меняется именно pathname (часть адреса БЕЗ якоря #)
  useEffect(() => {
    // 5. Принудительно прокручиваем окно в самый верх
    window.scrollTo(0, 0);
  }, [pathname]); // 👈 Зависимость только от pathname - это ключ к решению!

  // 6. Этот компонент ничего не рисует, он просто выполняет логику
  return null;
}
