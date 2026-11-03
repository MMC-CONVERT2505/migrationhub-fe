import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WORKS_WITH_PLATFORMS } from '@/constants/logos';
import { bannersService } from '@/api/banners';
import { extractList } from '@/utils/platformMap';
import type { BannerEntity } from '@/types/api';

/** A tool logo on its own (no frame): shows the brand logo, falling back to its name on load error. */
const LogoPill: React.FC<{ src: string; name: string }> = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex items-center justify-center h-14 px-1">
      {failed ? (
        <span className="text-lg font-bold text-text-secondary">{name}</span>
      ) : (
        <img
          src={src}
          alt={name}
          title={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-10 w-auto max-w-[190px] object-contain"
        />
      )}
    </div>
  );
};

export const WorksWith: React.FC = () => {
  // null = not yet loaded; falls back to the static platform list meanwhile and
  // whenever no ToolLogo banners exist or the request fails.
  const [logos, setLogos] = useState<BannerEntity[] | null>(null);

  useEffect(() => {
    let active = true;
    bannersService
      .list({ type: 'ToolLogo', take: 100 })
      .then((res) => {
        if (active) setLogos(extractList<BannerEntity>(res));
      })
      .catch(() => {
        if (active) setLogos([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const useToolLogos = !!logos && logos.length > 0;

  return (
    <section className="py-10 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <span className="text-sm font-medium text-text-tertiary uppercase tracking-widest whitespace-nowrap flex-shrink-0">
            Works with
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-10 gap-y-4">
            {useToolLogos
              ? logos!.map((logo, i) => (
                  <motion.div
                    key={logo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <LogoPill src={logo.image} name={logo.name} />
                  </motion.div>
                ))
              : WORKS_WITH_PLATFORMS.map((platform, i) => (
                  <motion.div
                    key={platform.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-2.5 px-1 py-2"
                  >
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center text-white text-sm font-bold font-mono flex-shrink-0"
                      style={{ backgroundColor: platform.color }}
                    >
                      {platform.abbr.slice(0, 1)}
                    </div>
                    <span className="text-base font-semibold text-text-secondary">{platform.name}</span>
                  </motion.div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};
