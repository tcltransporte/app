"use client"

import { useState, useContext, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  IconButton,
  Drawer,
  InputAdornment,
  Divider,
  Paper,
  Avatar,
  useTheme,
  useMediaQuery,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material"
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  AccountCircle,
  ArrowBack
} from "@mui/icons-material"
import * as loginAction from "@/app/actions/login.action"
import { ServiceStatus } from "@/libs/service"
import { ThemeContext } from "@/context/ThemeContext"
import { TextField, SelectField } from '@/components/controls'
import { Formik, Form, Field } from 'formik'
import Image from "next/image"


export function LoginView() {
  const { primaryColor, mode } = useContext(ThemeContext)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')

  const isDark = mode === 'dark'


  const [step, setStep] = useState('credentials') // 'credentials' or 'selection'
  const [companyBusinesses, setCompanyBusinesses] = useState([])
  const [companies, setCompanies] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Variables for session conflict Drawer
  const [sessionConflict, setSessionConflict] = useState(false)
  const [currentValues, setCurrentValues] = useState(null)

  const handleLogin = async (values, setFieldValue, setFieldError) => {
    setLoading(true)
    setError("")

    const result = await loginAction.signIn(values)

    switch (result.body?.code) {
      case "SELECT_COMPANY_BUSINESS":
        setCompanyBusinesses(result.body.companyBusinesses || [])
        setStep('selection')
        break
      case "SELECT_COMPANY":
        setCompanyBusinesses(result.body.companyBusinesses || [])
        setCompanies(result.body.companies || [])
        if (result.body.selectedCompanyBusinessId && setFieldValue) {
          setFieldValue('companyBusinessId', result.body.selectedCompanyBusinessId)
        }
        setStep('selection')
        break
      case "ACTIVE_SESSION_EXISTS":
        setSessionConflict(true)
        setCurrentValues(values)
        break
      default:
        if (result.header.status === ServiceStatus.SUCCESS) {
          if (result.body.token) {
            const redirectUrl = redirectParam || "/"
            window.location.href = redirectUrl
          }
        } else {
          setError(result.body?.message || result.message || "Erro ao realizar login")
        }
        break
    }

    setLoading(false)
  }

  const handleCompanyChange = (id, values, setFieldValue) => {
    setFieldValue('companyBusinessId', id)
    setFieldValue('companyId', '')
    setCompanies([])
    handleLogin({ ...values, companyBusinessId: id, companyId: "" }, setFieldValue)
  }

  const handleBranchChange = (id, values, setFieldValue) => {
    setFieldValue('companyId', id)
    handleLogin({ ...values, companyId: id }, setFieldValue)
  }

  const renderCredentialsStep = (values) => (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
          Bem-vindo! 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Por favor, faça login na sua conta
        </Typography>
      </Box>

      <Form>
        <Field
          component={TextField}
          name="username"
          fullWidth
          label="Usuário"
          placeholder=""
          sx={{
            mb: 3,
            '& .MuiFilledInput-root': {
              borderRadius: 2,
              border: '1px solid transparent',
              transition: 'all 0.2s ease',
              '&.Mui-focused': {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}11`,
              }
            }
          }}
          variant="filled"
          slotProps={{
            input: {
              disableUnderline: true,
            }
          }}
        />

        <Field
          component={TextField}
          name="password"
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label="Senha"
          placeholder=""
          sx={{
            mb: 2,
            '& .MuiFilledInput-root': {
              borderRadius: 2,
              border: '1px solid transparent',
              transition: 'all 0.2s ease',
              '&.Mui-focused': {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}11`,
              }
            }
          }}
          variant="filled"
          slotProps={{
            input: {
              disableUnderline: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }
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
      </Form>
    </>
  )

  const renderSelectionStep = (values, setFieldValue) => (
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
        <Field
          component={SelectField}
          name="companyBusinessId"
          label="Empresa"
          fullWidth
          variant="filled"
          options={companyBusinesses.map(cb => ({ value: cb.id, label: cb.name }))}
          onChange={(val) => handleCompanyChange(val, values, setFieldValue)}
          sx={{
            '& .MuiFilledInput-root': {
              borderRadius: 2,
              border: '1px solid transparent',
              transition: 'all 0.2s ease',
              '&.Mui-focused': {
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}11`,
              }
            }
          }}
          slotProps={{
            input: {
              disableUnderline: true,
            }
          }}
        />

        {companies.length > 0 && (
          <Field
            component={SelectField}
            name="companyId"
            label="Filial"
            fullWidth
            variant="filled"
            disabled={!companies.length}
            options={companies.map(c => ({ value: c.companyId, label: c.surname }))}
            onChange={(val) => handleBranchChange(val, values, setFieldValue)}
            sx={{
              '& .MuiFilledInput-root': {
                borderRadius: 2,
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                '&.Mui-focused': {
                  borderColor: primaryColor,
                  backgroundColor: `${primaryColor}11`,
                }
              }
            }}
            slotProps={{
              input: {
                disableUnderline: true,
              }
            }}
          />
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={() => handleLogin(values, setFieldValue)}
          disabled={loading}
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
          {loading ? 'Carregando...' : 'Continuar'}
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
          padding: 4,
          backgroundColor: isDark ? '#1E1E2D' : '#f0f0f5', // Dynamic background
          color: isDark ? 'white' : 'text.primary',
          transition: 'all 0.3s ease'
        }}>
          {/* Wave/Curve background effect */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '150%',
            height: '60%',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(99, 102, 241, 0.05)',
            borderTopRightRadius: '100%',
            zIndex: 0,
            transition: 'all 0.3s ease'
          }} />

          {/* Logo (Placeholder - top left) */}
          <Box sx={{ position: 'absolute', top: 32, left: 32 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: isDark ? 'white' : primaryColor }}>Logo</Typography>
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
        <Formik
          initialValues={{
            username: "",
            password: "",
            companyBusinessId: "",
            companyId: ""
          }}
          onSubmit={(values, { setFieldValue, setFieldError }) => handleLogin(values, setFieldValue, setFieldError)}
        >
          {({ values, setFieldValue }) => (
            <>
              {step === 'credentials' ? renderCredentialsStep(values) : renderSelectionStep(values, setFieldValue)}
            </>
          )}
        </Formik>

        {/* Session Conflict Drawer */}
        <Drawer
          anchor="bottom"
          open={sessionConflict}
          onClose={() => setSessionConflict(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              p: 4,
              backgroundColor: isDark ? '#1e1e1e' : '#fff'
            }
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: '#ef444415', color: '#ef4444', width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <AccountCircle sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Este usuário já está logado em outro dispositivo
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Parece que o seu usuário já está conectado em outro dispositivo. Deseja encerrar a outra sessão e continuar o login aqui?
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center' }}>
              <Button
                variant="text"
                onClick={() => {
                  setSessionConflict(false)
                  setLoading(false)
                }}
                disabled={loading}
                sx={{ py: 1.2, px: 4, borderRadius: 2, fontWeight: 'bold', minWidth: 160 }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setSessionConflict(false)
                  // Call handleLogin forcing the session replacement
                  handleLogin({ ...currentValues, forceCloseSession: true }, null, null)
                }}
                disabled={loading}
                sx={{
                  py: 1.2,
                  px: 4,
                  backgroundColor: primaryColor,
                  '&:hover': { backgroundColor: primaryColor },
                  borderRadius: 2,
                  fontWeight: 'bold',
                  minWidth: 160
                }}
              >
                {loading ? 'Carregando...' : 'Continuar'}
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Box>
    </Box>
  )
}
