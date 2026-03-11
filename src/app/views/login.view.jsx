"use client"

import { useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  Link, 
  IconButton, 
  InputAdornment,
  Divider,
  Paper,
  useTheme,
  useMediaQuery
} from "@mui/material"
import { 
  Visibility, 
  VisibilityOff,
  Google as GoogleIcon,
  ArrowBack
} from "@mui/icons-material"
import * as loginService from "@/app/services/login.service"
import { ServiceStatus } from "@/libs/service"
import { ThemeContext } from "@/context/ThemeContext"
import Image from "next/image"
import { MenuItem, Select, FormControl, InputLabel } from "@mui/material"

export function LoginView() {
  const { primaryColor } = useContext(ThemeContext)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const router = useRouter()

  const [form, setForm] = useState({
    username: "",
    password: "",
    companyBusinessId: "",
    companyId: ""
  })

  const [step, setStep] = useState('credentials') // 'credentials' or 'selection'
  const [companyBusinesses, setCompanyBusinesses] = useState([])
  const [companies, setCompanies] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e, currentForm = form) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const loginResult = await loginService.signIn(currentForm)

      if (loginResult.status !== ServiceStatus.SUCCESS) {
        throw loginResult
      }

      if (loginResult.token) {
        document.cookie = `authorization=${loginResult.token}; path=/; max-age=${60 * 60 * 8}`
        router.push("/settings")
        router.refresh()
      }
    } catch (err) {
      if (err.code === "SELECT_COMPANY_BUSINESS") {
        setCompanyBusinesses(err.companyBusinesses || [])
        setStep('selection')
      } else if (err.code === "SELECT_COMPANY") {
        setCompanies(err.companies || [])
        setStep('selection')
      } else {
        setError(err.message || "Erro ao realizar login")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyChange = (id) => {
    const newForm = { ...form, companyBusinessId: id, companyId: "" }
    setForm(newForm)
    setCompanies([]) // Clear branches while loading new ones
    handleLogin(null, newForm)
  }

  const handleBranchChange = (id) => {
    const newForm = { ...form, companyId: id }
    setForm(newForm)
    handleLogin(null, newForm)
  }

  const renderCredentialsStep = () => (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
          Bem-vindo! 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Por favor, faça login na sua conta
        </Typography>
      </Box>

      <form onSubmit={handleLogin}>
        <TextField
          fullWidth
          label="Usuário"
          placeholder="Digite seu usuário"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          sx={{ mb: 3 }}
          variant="filled"
          InputProps={{ disableUnderline: true, sx: { borderRadius: 2 } }}
        />

        <TextField
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label="Senha"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          sx={{ mb: 2 }}
          variant="filled"
          InputProps={{ 
            disableUnderline: true, 
            sx: { borderRadius: 2 },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <FormControlLabel
            control={<Checkbox size="small" />}
            label={<Typography variant="body2">Lembrar</Typography>}
          />
          <Link href="#" variant="body2" sx={{ color: primaryColor, textDecoration: 'none' }}>
            Esqueceu sua senha?
          </Link>
        </Box>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ 
            py: 1.5, 
            backgroundColor: primaryColor, 
            '&:hover': { backgroundColor: primaryColor },
            textTransform: 'none',
            borderRadius: 2,
            mb: 3,
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        {error && step === 'credentials' && (
          <Typography variant="body2" color="error" sx={{ mb: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        <Typography variant="body2" sx={{ textAlign: 'center', mb: 4 }}>
          Ainda não possui uma conta? <Link href="#" sx={{ color: primaryColor, textDecoration: 'none' }}>Cadastre-se</Link>
        </Typography>

        <Divider sx={{ mb: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>ou</Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon sx={{ color: '#ea4335' }} />}
          sx={{ 
            py: 1.2, 
            borderColor: 'rgba(0,0,0,0.12)', 
            color: 'text.primary',
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': { borderColor: 'rgba(0,0,0,0.24)', backgroundColor: 'transparent' }
          }}
        >
          Entrar com Google
        </Button>
      </form>
    </>
  )

  const renderSelectionStep = () => (
    <>
      <Box sx={{ mb: 4, position: 'relative' }}>
        <IconButton 
          onClick={() => setStep('credentials')} 
          sx={{ position: 'absolute', top: -48, left: -8 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Próximo passo! 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Informe a empresa
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth variant="filled">
          <InputLabel id="company-label">Empresa</InputLabel>
          <Select
            labelId="company-label"
            value={form.companyBusinessId}
            onChange={(e) => handleCompanyChange(e.target.value)}
            disableUnderline
            sx={{ borderRadius: 2 }}
          >
            {companyBusinesses.map((cb) => (
              <MenuItem key={cb.id} value={cb.id}>{cb.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="filled">
          <InputLabel id="branch-label">Filial</InputLabel>
          <Select
            labelId="branch-label"
            value={form.companyId}
            onChange={(e) => handleBranchChange(e.target.value)}
            disableUnderline
            sx={{ borderRadius: 2 }}
            disabled={!companies.length}
          >
            {companies.map((c) => (
              <MenuItem key={c.companyId} value={c.companyId}>{c.surname}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          fullWidth
          variant="contained"
          onClick={() => handleLogin()}
          disabled={loading || !form.companyId}
          sx={{ 
            py: 1.5, 
            mt: 2,
            backgroundColor: primaryColor, 
            '&:hover': { backgroundColor: primaryColor },
            textTransform: 'none',
            borderRadius: 2,
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          {loading ? 'Processando...' : 'Continuar'}
        </Button>

        {error && step === 'selection' && (
          <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
      </Box>
    </>
  )

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100%',
      backgroundColor: '#f8f9fa',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Left Decoration Side (Desktop Only) */}
      {!isMobile && (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: 4
        }}>
          {/* Wave/Curve background effect */}
          <Box sx={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '150%',
            height: '60%',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            borderTopRightRadius: '100%',
            zIndex: 0
          }} />

          {/* Logo (Placeholder - top left) */}
          <Box sx={{ position: 'absolute', top: 32, left: 32 }}>
             <Typography variant="h5" sx={{ fontWeight: 'bold', color: primaryColor }}>Logo</Typography>
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            {/* The Illustration */}
            <Box sx={{ mb: 4 }}>
               <img 
                 src="/assets/login-illustration.png" 
                 alt="Login Illustration" 
                 style={{ maxWidth: '400px', height: 'auto', borderRadius: '20px' }} 
               />
            </Box>
            
            {/* The 3D Sphere effect area */}
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'radial-gradient(circle at 30% 30%, #555, #111)',
              boxShadow: '0 40px 60px rgba(0,0,0,0.3)',
              margin: '0 auto',
              mt: 4
            }} />
          </Box>
        </Box>
      )}

      {/* Right Login Form Side */}
      <Box sx={{ 
        width: isMobile ? '100%' : '580px', 
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isMobile ? 4 : 8,
        zIndex: 2,
        boxShadow: isMobile ? 'none' : '-10px 0 30px rgba(0,0,0,0.02)'
      }}>
        {step === 'credentials' ? renderCredentialsStep() : renderSelectionStep()}
      </Box>
    </Box>
  )
}