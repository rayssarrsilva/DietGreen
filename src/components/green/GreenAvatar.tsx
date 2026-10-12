import Image from "next/image";

export function GreenAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/green-avatar.svg"
      alt="Green"
      width={size}
      height={size}
      unoptimized
      className={className}
      style={{ borderRadius: "9999px" }}
    />
  );
}
