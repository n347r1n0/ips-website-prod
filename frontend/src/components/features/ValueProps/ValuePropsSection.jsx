// src/components/features/ValueProps/ValuePropsSection.jsx

import { FeatureCard } from './FeatureCard.jsx';
import { motion } from 'framer-motion';

// Иконки (просто SVG код)
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" /></svg>;
const ChipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962a3.752 3.752 0 0 1-4.493 0L5.25 15.75m0-2.25a2.25 2.25 0 0 0-2.25 2.25c0 1.152.26 2.243.723 3.218C5.293 20.25 6.157 21 7.118 21h7.764a2.25 2.25 0 0 0 2.25-2.25m-2.25-2.25a2.25 2.25 0 0 0-2.25-2.25H7.5m9-6.5-1-1a1.5 1.5 0 0 0-2 0L9.75 7.5l-1.5-1.5a1.5 1.5 0 0 0-2 0l-1.5 1.5m1.5-4.5-1.5 1.5" /></svg>;

const features = [
  { icon: <ShieldIcon />, title: 'Комфорт и Приватность', text: 'Игра проходит на высоком уровне в стильном лофт-пространстве частного особняка.' },
  { icon: <ChipIcon />, title: 'Профессиональная Игра', text: 'Лучшие условия и сертифицированное оборудование для спортивного покера.' },
  { icon: <UsersIcon />, title: 'Нетворкинг и Сообщество', text: 'Возможность познакомиться и пообщаться в кругу успешных единомышленников.' },
];


export function ValuePropsSection() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          // 2. Оборачиваем каждую карточку в анимированный div
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: index * 0.2 }} // Задержка зависит от индекса
            viewport={{ once: true }}
          >
            <FeatureCard icon={feature.icon} title={feature.title} text={feature.text} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}


// export function ValuePropsSection() {
//   return (
//     <div className="max-w-7xl mx-auto px-4">
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//         {features.map(feature => (
//           <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} text={feature.text} />
//         ))}
//       </div>
//     </div>
//   );
// }