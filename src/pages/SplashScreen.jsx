import { motion, AnimatePresence } from "framer-motion";
import logo_full from "../assets/images/logo_full_940.png";
import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [shine, setShine] = useState(false);
  const [fade, setFade] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = 2800;
    const start = performance.now();
    let frameId;

    const animate = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = Math.sin((t * Math.PI) / 2);
      setProgress(eased * 100);

      if (t < 1) frameId = requestAnimationFrame(animate);
      else {
        setTimeout(() => setShine(true), 150);
        setTimeout(() => setFade(true), 1100);
        setTimeout(() => {
          setVisible(false);
          onFinish?.();
        }, 1800);
      }
    };

    frameId = requestAnimationFrame(animate);

    // cleanup nếu effect bị rerun hoặc unmount
    return () => cancelAnimationFrame(frameId);
  }, []); // ⚠️ chỉ chạy 1 lần

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className={`fixed inset-0 flex flex-col items-center justify-center bg-black z-[99999] ${fade ? "pointer-events-none" : ""
          }`}
        initial={{ opacity: 1 }}
        animate={{ opacity: fade ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* LOGO */}
        <motion.div
          className="relative inline-block w-fit overflow-hidden"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <img
            src={logo_full}
            alt="Needflex Logo"
            className="w-64 md:w-80 relative z-10 select-none pointer-events-none"
            draggable={false}
          />

          {/* ÁNH SÁNG QUÉT */}
          {shine && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[6px] skew-x-[20deg]"
              initial={{ x: "-150%" }}
              animate={{ x: "150%" }}
              transition={{
                duration: 1,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>

        {/* THANH LOAD */}
        <motion.div
          className="mt-8 w-40 h-1 bg-gray-700 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-red-600 rounded-full origin-left"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
