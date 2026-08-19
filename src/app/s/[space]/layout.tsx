"use client";

import { use } from "react";
import { SpaceProvider } from "@/components/SpaceProvider";

export default function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ space: string }>;
}) {
  const { space } = use(params);
  return <SpaceProvider slug={decodeURIComponent(space)}>{children}</SpaceProvider>;
}
