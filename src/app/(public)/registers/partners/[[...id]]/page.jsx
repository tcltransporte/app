"use server"

import { ViewPartners } from "@/app/views/registers/partners/partners.view"

export default async ({ params }) => {
  const { id } = await params;
  return <ViewPartners partnerId={id?.[0]} />
}
