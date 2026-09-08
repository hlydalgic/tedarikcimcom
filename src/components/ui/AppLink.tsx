import Link from "next/link";
import type { ComponentProps } from "react";

export type AppLinkProps = ComponentProps<typeof Link>;

export function AppLink({ prefetch = true, ...props }: AppLinkProps) {
  return <Link prefetch={prefetch} {...props} />;
}
