"use server"

import { ViewPartners } from "@/app/views/registers/partners.view"

export default async ({ params }) => {
  const { slug } = await params;
  return <ViewPartners initialId={slug?.[0]} />
}
