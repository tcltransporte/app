"use client"

import { useState } from "react"
import * as loginService from "@/app/controllers/login.controller"
import { useRouter } from "next/navigation"

export function LoginView() {

  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e) => {
    try {

      e.preventDefault()

      await loginService.signIn(form)
  
      router.push("/settings")
      router.refresh()
  
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <form onSubmit={handleLogin} style={{ display: "inline-block" }}>
        <input type="text" placeholder="Email" onChange={e => setForm({...form, username: e.target.value})} required /><br/>
        <input type="password" placeholder="Senha" onChange={e => setForm({...form, password: e.target.value})} required /><br/>
        <button type="submit">Entrar</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  )
  
}