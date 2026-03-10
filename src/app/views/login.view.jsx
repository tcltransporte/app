"use client"

import { useState } from "react"
import * as loginService from "@/app/services/login.service"
import { useRouter } from "next/navigation"
import { ServiceRequest } from "@/libs/service"

export function LoginView() {

  const [form, setForm] = useState({
    username: "",
    password: "",
    companyBusinessId: "",
    companyId: ""
  })

  const [companyBusinesses, setCompanyBusinesses] = useState([])
  const [companies, setCompanies] = useState([])

  const [error, setError] = useState("")

  const router = useRouter()

  const handleLogin = async (e) => {

    try {

      e.preventDefault()

      const loginResult = await ServiceRequest.run(loginService.signIn(form))

      console.log(loginResult)

      if (loginResult.token) {

        document.cookie = `authorization=${loginResult.token}; path=/; max-age=${60 * 60 * 8}`;

        router.push("/settings")
        router.refresh()
        return

      }

    } catch (error) {

      if (error.code === "SELECT_COMPANY_BUSINESS") {
        setCompanyBusinesses(error.companyBusinesses)
        return
      }

      if (error.code === "SELECT_COMPANY") {
        setCompanies(error.companies)
        return
      }

      setError(error.message)

    }

  }

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <form onSubmit={handleLogin} style={{ display: "inline-block" }}>

        <input
          type="text"
          placeholder="Email"
          onChange={e => setForm({ ...form, username: e.target.value })}
          required
        /><br/>

        <input
          type="password"
          placeholder="Senha"
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        /><br/>

        {companyBusinesses?.length > 0 && (
          <>
            <select
              onChange={e => setForm({ ...form, companyBusinessId: e.target.value })}
              required
            >
              <option value="">Selecione o grupo</option>

              {companyBusinesses.map((cb, key) => (
                <option key={key} value={cb.id}>
                  {cb.id} - {cb.name}
                </option>
              ))}

            </select>
            <br/>
          </>
        )}

        {companies.length > 0 && (
          <>
            <select
              onChange={e => setForm({ ...form, companyId: e.target.value })}
              required
            >
              <option value="">Selecione a filial</option>

              {companies.map((c, key) => (
                <option key={key} value={c.companyId}>
                  {c.companyId} - {c.surname}
                </option>
              ))}

            </select>
            <br/>
          </>
        )}

        <button type="submit">Entrar</button>

        {error && <p style={{ color: "red" }}>{error}</p>}

      </form>
    </div>
  )

}