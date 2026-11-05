import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  footerText?: string;
  icon: ReactNode;
  isLoading?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  footerText,
  icon,
  isLoading = false,
}: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-border bg-card/75 backdrop-blur-md">
      <CardContent className="p-5">
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

        {footerText && (
          <div className="mt-3 text-xs text-muted-foreground font-medium truncate">
            {isLoading ? <Skeleton className="h-4 w-36 mt-1" /> : footerText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
