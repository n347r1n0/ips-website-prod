// src/components/features/ValueProps/FeatureCard.jsx

export function FeatureCard({ icon, title, text }) {
  return (
    <div
      className="group bg-black/10 p-8 rounded-3xl text-center flex flex-col items-center h-full
                 transition-all duration-300 ease-in-out
                 hover:bg-black/20 hover:-translate-y-2 hover:scale-105
                 border border-white/10 hover:border-white/20
                 shadow-lg hover:shadow-xl"
    >

      {/* Icon container with hover effects */}
      <div className="bg-teal-500/20 p-4 rounded-xl mb-6 border border-teal-400/30
                     transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-accent/20 group-hover:border-gold-accent">
        <div className="w-8 h-8 text-teal-300 group-hover:text-gold-accent transition-colors duration-300">{icon}</div>
      </div>

      {/* Title with hover glow effect */}
      <h3 className="font-brand text-2xl font-bold text-white uppercase mb-4 transition-all duration-300
                     group-hover:text-gold-accent group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
         {title}
      </h3>

      {/* Description text */}
      <p className="text-white/70 leading-relaxed transition-colors duration-300 group-hover:text-white">
        {text}</p>
    </div>
  );
}
