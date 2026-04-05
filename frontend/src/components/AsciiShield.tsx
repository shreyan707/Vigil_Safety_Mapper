import React from 'react';
import { motion } from 'motion/react';

const SHIELD_ASCII = `
      .---.
     /     \\
    |       |
    |  SHD  |
     \\     /
      '---'
`.trim();

// A more detailed shield
const DETAILED_SHIELD = [
  "      .--------.      ",
  "    /            \\    ",
  "   /              \\   ",
  "  |      SAFE      |  ",
  "  |     SPACE      |  ",
  "   \\              /   ",
  "    \\            /    ",
  "      '--------'      ",
  "          ||          ",
  "          ''          "
];

export default function AsciiShield() {
  return (
    <div className="font-mono text-[10px] md:text-sm leading-none text-rose-600 flex flex-col items-center justify-center h-full">
      {DETAILED_SHIELD.map((line, i) => (
        <motion.pre
          key={i}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        >
          {line}
        </motion.pre>
      ))}
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-4 text-xs font-bold uppercase tracking-widest"
      >
        System Breathing...
      </motion.div>
    </div>
  );
}
