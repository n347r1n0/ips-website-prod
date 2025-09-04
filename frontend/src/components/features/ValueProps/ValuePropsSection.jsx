// src/components/features/ValueProps/ValuePropsSection.jsx

import { FeatureCard } from './FeatureCard.jsx';
import { motion } from 'framer-motion';

// Иконки (просто SVG код)
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" /></svg>;
const ChipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>;
const NetworkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>;

const features = [
  { icon: <ShieldIcon />, title: 'Комфорт и Приватность', text: 'Игра проходит на высоком уровне в стильном лофт-пространстве частного особняка.' },
  { icon: <ChipIcon />, title: 'Профессиональная Игра', text: 'Лучшие условия и сертифицированное оборудование для спортивного покера.' },
  { icon: <NetworkIcon />, title: 'Нетворкинг и Сообщество', text: 'Возможность познакомиться и пообщаться в кругу успешных единомышленников.' },
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