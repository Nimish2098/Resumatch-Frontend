import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { Link } from "react-router-dom";

export type NavItem = {
  name: string;
  link: string;
  icon?: ReactNode;
};

export function FloatingNav({ navItems }: { navItems: NavItem[] }) {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    const previous = scrollYProgress.getPrevious() ?? 0;
    // show only after the top of the page, and only while scrolling up
    setVisible(current >= 0.05 && current - previous < 0);
  });

  return (
    <AnimatePresence mode="wait">
      <motion.nav
        className="floating-nav"
        initial={{ opacity: 0, y: -100 }}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {navItems.map((item) =>
          item.link.startsWith("#") ? (
            <a key={item.name} href={item.link} className="floating-nav-link">
              {item.icon}
              <span>{item.name}</span>
            </a>
          ) : (
            <Link key={item.name} to={item.link} className="floating-nav-link">
              {item.icon}
              <span>{item.name}</span>
            </Link>
          )
        )}
      </motion.nav>
    </AnimatePresence>
  );
}