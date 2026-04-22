import { memo } from "react";
import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot.png";

const PingoLoader = memo(() => (
  <motion.div
    className="flex flex-col items-center justify-center min-h-screen bg-background gap-5"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {/* Mascot with float animation */}
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-125 animate-pulse" />
      <motion.img
        src={mascotImg}
        alt="Pingo carregando"
        className="relative w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-lg"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
        draggable={false}
        width={80}
        height={80}
      />
    </div>

    {/* Loading dots */}
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-2 h-2 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>

    <p className="text-[13px] text-muted-foreground font-medium tracking-wide">
      Carregando...
    </p>
  </motion.div>
));

PingoLoader.displayName = "PingoLoader";
export default PingoLoader;
