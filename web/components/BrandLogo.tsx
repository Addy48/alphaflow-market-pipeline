import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "full",
  size = "md",
  priority = false,
  className = "",
}) => {
  if (variant === "icon") {
    const dim = size === "sm" ? 20 : size === "lg" ? 36 : 28;
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/brand/alphaflow_logo_dark.png"
          alt="BellCurve Data"
          width={dim}
          height={dim}
          priority={priority}
          className="object-contain hidden dark:block"
        />
        <Image
          src="/brand/alphaflow_logo_light.png"
          alt="BellCurve Data"
          width={dim}
          height={dim}
          priority={priority}
          className="object-contain block dark:hidden"
        />
      </div>
    );
  }

  // Full Wordmark
  const height = size === "sm" ? 16 : size === "lg" ? 28 : 20;
  const width = Math.round(height * 4.8);

  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      <Image
        src="/brand/alphaflow_logo_dark_transparent.png"
        alt="BellCurve Data"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto object-contain hidden dark:block"
      />
      <Image
        src="/brand/alphaflow_logo_light_transparent.png"
        alt="BellCurve Data"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto object-contain block dark:hidden"
      />
    </div>
  );
};
