// src/components/features/ValueProps/FeatureCard.jsx

export function FeatureCard({ icon, title, text }) {
  return (
    <div
      // 1. Добавляем класс 'group', чтобы дочерние элементы могли реагировать на наведение
      className="group bg-transparent p-8 rounded-3xl text-center flex flex-col items-center h-full
                 transition-all duration-300 ease-in-out
                 hover:-translate-y-2
                 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),_-5px_-5px_12px_rgba(255,255,255,0.02),_5px_5px_12px_rgba(0,0,0,0.4)]
                 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),_inset_-3px_-3px_7px_rgba(255,255,255,0.02),_inset_3px_3px_7px_rgba(0,0,0,0.4)]"
    >

      {/* 2. Добавляем классы для анимации при наведении на родителя (group-hover) */}
      <div className="bg-[#008080]/20 p-4 rounded-xl mb-6 border border-teal-400/30
                     transition-all duration-300 group-hover:scale-110 group-hover:border-gold-accent">
        <div className="w-8 h-8 text-teal-300">{icon}</div>
      </div>

      {/* 👇 ОБНОВЛЯЕМ КЛАССЫ ДЛЯ ЗАГОЛОВКА, КОМБИНИРУЯ ОБЕ ТЕНИ 👇 */}
      <h3 className="font-brand text-2xl font-bold text-white uppercase mb-4 transition-all duration-300
                     [text-shadow:2px_2px_3px_rgba(0,0,0,0.7)]
                     group-hover:[text-shadow:2px_2px_3px_rgba(0,0,0,0.7),_0_0_10px_theme(colors.deep-teal)]">
         {title}
      </h3>


      <p className="text-white/70 leading-relaxed transition-colors duration-300 group-hover:text-gold-accent">
        {text}</p>
    </div>
  );
}
