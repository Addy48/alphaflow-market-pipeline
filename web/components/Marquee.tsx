"use client";

import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  pauseOnHover?: boolean;
  reverse?: boolean;
  className?: string;
  speedSeconds?: number;
}

export const Marquee: React.FC<MarqueeProps> = ({
  children,
  pauseOnHover = true,
  reverse = false,
  className = "",
  speedSeconds = 35
}) => {
  return (
    <div
      className={`group flex overflow-hidden p-0.5 select-none [-webkit-mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] ${className}`}
    >
      <div
        className={`flex shrink-0 items-center justify-around gap-3 min-w-full animate-marquee ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        } ${reverse ? "[animation-direction:reverse]" : ""}`}
        style={{ animationDuration: `${speedSeconds}s` }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-around gap-3 min-w-full animate-marquee ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        } ${reverse ? "[animation-direction:reverse]" : ""}`}
        style={{ animationDuration: `${speedSeconds}s` }}
      >
        {children}
      </div>
    </div>
  );
};
