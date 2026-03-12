"use server"

import { Suspense } from "react"
import { LoginView } from "@/app/views/login.view"

export default async () => {

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginView />
    </Suspense>
  )

}