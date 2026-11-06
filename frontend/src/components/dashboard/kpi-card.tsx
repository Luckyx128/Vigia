'use client';

import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SpotlightCard, { SpotlightShape } from '@/components/ui/SpotlightCard';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  footerText?: string;
  icon: ReactNode;
  isLoading?: boolean;
  spotlightColor?: string;
  shape?: SpotlightShape;
}

export function KpiCard({
  title,
  value,
  subtitle,
  footerText,
  icon,
  isLoading = false,
  spotlightColor = '#06b6d4',
  shape = 'circle',
}: KpiCardProps) {
  return (
    <SpotlightCard
      spotlightColor={spotlightColor}
      intensity={0.22}
      spotlightSize={260}
      softness={0.75}
      shape={shape}
      borderGlow={0.65}
      proximity={90}
      smoothing={0.25}
      flare
      className="border border-border/80 bg-card/75 backdrop-blur-md shadow-sm transition-all"
    >
      <div className="p-5 flex flex-col justify-between h-full w-full">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            <div className="p-2 rounded-xl bg-muted/80 text-foreground border border-border">
              {icon}
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {value}
              </span>
            )}
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        </div>

        {footerText && (
          <div className="mt-3 text-xs text-muted-foreground font-medium truncate">
            {isLoading ? <Skeleton className="h-4 w-36 mt-1" /> : footerText}
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}
