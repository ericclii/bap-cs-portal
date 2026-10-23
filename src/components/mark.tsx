import Image from "next/image";

/** The chapter crest. Decorative wherever the words beside it name the app. */
export function Mark({ size = 30 }: { size?: number }) {
  return <Image src="/seal.png" alt="" width={size} height={size} unoptimized priority className="shrink-0" />;
}
