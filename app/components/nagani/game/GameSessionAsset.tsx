"use client";

import { useState } from "react";

type GameSessionAssetProps = {
  src: string;
  alt: string;
  className: string;
};

export default function GameSessionAsset({
  src,
  alt,
  className,
}: GameSessionAssetProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}