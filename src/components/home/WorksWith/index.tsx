import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WORKS_WITH_PLATFORMS } from '@/constants/logos';
import { bannersService } from '@/api/banners';
import { extractList } from '@/utils/platformMap';
import type { BannerEntity } from '@/types/api';
import { trimmedLogoUrl } from '@/utils/trimLogo';

/** Display height (px) for a logo of this width/height ratio: roughly equal visual weight, so compact logos (a round mark,
 *  a short wordmark) are a little taller than long, thin ones. */
export const logoHeight = (aspect: number): number =>
  !Number.isFinite(aspect) || aspect <= 0 ? 40 : Math.min(52, Math.max(36, Math.round(Math.sqrt(5200 / aspect))));

/** A tool logo on its own (no frame): shows the brand logo, falling back to its name on load error. */
const LogoPill: React.FC<{ src: string; name: string }> = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  // Logos are uploaded on canvases of any shape; cut the empty margins so they all read at the same size.
  const [trimmed, setTrimmed] = useState<string | null>(null);
  const [aspect, setAspect] = useState(0);
  useEffect(() => {
    let active = true;
    trimmedLogoUrl(src).then((u) => { if (active && u) setTrimmed(u); });
    return () => { active = false; };
  }, [src]);
  return (
    <div className="flex items-center justify-center h-14 w-full px-1">
      {failed ? (
        <span className="text-lg font-bold text-text-secondary">{name}</span>
      ) : (
        <img
          src={trimmed ?? src}
          alt={name}
          title={name}
          loading="lazy"
          onLoad={(e) => setAspect(e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1))}
          onError={() => (trimmed ? setTrimmed(null) : setFailed(true))}
          style={{ height: logoHeight(aspect) }}
          className="w-auto max-w-full object-contain"
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
          {/* Four to a row (two on a phone), so eight logos make two even rows. */}
          <div className="grid w-full flex-1 grid-cols-2 items-center justify-items-center gap-x-8 gap-y-4 sm:grid-cols-4">
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
