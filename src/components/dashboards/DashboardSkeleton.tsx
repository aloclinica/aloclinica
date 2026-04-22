import { motion } from "framer-motion";
import { memo, useEffect, useState } from "react";
import { PINGO_LOGO_URL } from "@/lib/constants";
const logo = PINGO_LOGO_URL;

const Bone = ({ className = "" }: { className?: string }) => (
  <div className={`shimmer-v2 rounded-xl ${className}`} aria-hidden="true" />
);

/** Progress bar that fills while loading */
const LoadingProgress = () => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setWidth(40), 100);
    const t2 = setTimeout(() => setWidth(70), 600);
    const t3 = setTimeout(() => setWidth(85), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div className="h-0.5 w-full bg-muted/50 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary/40 rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const DashboardSkeleton = () => (
  <motion.div
    variants={stagger} initial="hidden" animate="show"
    className="space-y-4 pb-24"
    role="status" aria-busy="true" aria-label="Carregando painel..."
  >
    {/* Loading indicator */}
    <motion.div variants={item} className="space-y-2">
      <div className="flex items-center justify-center gap-3 py-2">
        <motion.img
          src={logo} alt="AloClínica"
          className="w-8 h-8 rounded-xl select-none"
          animate={{ rotate: [0, -6, 6, -6, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/40"
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">Carregando...</span>
      </div>
      <LoadingProgress />
    </motion.div>

    {/* Hero skeleton — full bleed */}
    <motion.div variants={item} className="-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-5 lg:-mt-6">
      <div className="rounded-b-3xl bg-primary/8 p-5 pb-4" style={{ minHeight: 180 }}>
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <Bone className="h-16 w-[180px] rounded-2xl" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-1 min-w-[64px] space-y-1.5 bg-white/6 rounded-xl p-2.5">
                  <Bone className="h-5 w-10 mx-auto" />
                  <Bone className="h-2 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>
          <Bone className="w-[100px] h-[100px] rounded-full shrink-0" />
        </div>
      </div>
    </motion.div>

    {/* Wallet card skeleton */}
    <motion.div variants={item}>
      <div className="rounded-[22px] p-[18px] bg-primary/10 space-y-2 h-[106px]">
        <Bone className="h-5 w-8 rounded-md" />
        <Bone className="h-4 w-36" />
        <div className="flex justify-between mt-2">
          <Bone className="h-3 w-20" />
          <Bone className="h-5 w-20 rounded-xl" />
        </div>
      </div>
    </motion.div>

    {/* Action pills */}
    <motion.div variants={item}>
      <div className="flex gap-2 overflow-hidden">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-2 p-2.5 rounded-3xl border border-border/30 bg-card/60 shrink-0">
            <Bone className="h-6 w-6 rounded-lg" />
            <Bone className="h-3 w-12" />
          </div>
        ))}
      </div>
    </motion.div>

    {/* 2-col desktop grid */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <motion.div variants={item} className="space-y-4">
        {/* Bento 2x2 */}
        <div className="grid grid-cols-2 gap-2.5">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-border/20 bg-card overflow-hidden" style={{ height: 105 }}>
              <div className="h-[3px] bg-primary/20 w-full" />
              <div className="p-3.5 space-y-2">
                <Bone className="h-8 w-8 rounded-[10px]" />
                <Bone className="h-6 w-16" />
                <Bone className="h-2.5 w-14" />
              </div>
            </div>
          ))}
        </div>
        {/* Next appt card */}
        <div className="rounded-2xl border border-border/20 bg-card overflow-hidden flex" style={{ height: 88 }}>
          <div className="w-[56px] bg-muted/40 shrink-0" />
          <div className="flex-1 p-3.5 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
            <Bone className="h-5 w-20 rounded-lg" />
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="space-y-4">
        {/* Metrics 3x2 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="rounded-2xl border border-border/20 bg-card p-3 space-y-1.5 text-center">
              <Bone className="h-5 w-5 mx-auto rounded-lg" />
              <Bone className="h-4 w-12 mx-auto" />
              <Bone className="h-2 w-10 mx-auto" />
            </div>
          ))}
        </div>
        {/* List */}
        <div className="rounded-2xl border border-border/20 bg-card overflow-hidden">
          <div className="p-3.5 border-b border-border/15"><Bone className="h-4 w-28" /></div>
          {[0,1,2].map(i => (
            <div key={i} className="flex items-center gap-3 p-3.5 border-b border-border/10 last:border-0">
              <Bone className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3.5 w-3/4" />
                <Bone className="h-2.5 w-1/2" />
              </div>
              <Bone className="h-6 w-14 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>

    <span className="sr-only">Carregando dados do painel, por favor aguarde.</span>
  </motion.div>
);

export default memo(DashboardSkeleton);
