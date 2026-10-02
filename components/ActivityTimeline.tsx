"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";
import { ActivityItem } from "@/lib/types";

interface ActivityTimelineProps {
  items: ActivityItem[];
}

export default function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (items.length === 0) return null;

  return (
    <div className="animate-fade-in">
      <div className="space-y-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={item.id} className="flex gap-3" style={{ animationDelay: `${index * 60}ms` }}>
              {/* Timeline connector */}
              <div className="flex flex-col items-center pt-0.5">
                <div className="shrink-0">
                  {item.status === "complete" ? (
                    <div className="w-5 h-5 rounded-full bg-success-light flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                  ) : item.status === "running" ? (
                    <div className="w-5 h-5 rounded-full bg-accent-light flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-accent animate-spin-slow" />
                    </div>
                  ) : item.status === "error" ? (
                    <div className="w-5 h-5 rounded-full bg-danger-light flex items-center justify-center">
                      <AlertCircle className="w-3 h-3 text-danger" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border bg-surface" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-px flex-1 min-h-[20px] ${
                    item.status === "complete" ? "bg-success/20" : "bg-border"
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                <div className="flex items-baseline gap-3">
                  <p className={`text-[13px] font-medium leading-5 ${
                    item.status === "running" ? "text-accent" :
                    item.status === "complete" ? "text-fg" :
                    "text-fg-muted"
                  }`}>
                    {item.title}
                  </p>
                  {item.timestamp && (
                    <span className="text-[11px] text-fg-muted tabular-nums whitespace-nowrap">
                      {item.timestamp}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-[12px] text-fg-muted mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
