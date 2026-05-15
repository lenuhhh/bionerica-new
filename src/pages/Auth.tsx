import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { signInEmail, signUpEmail, signInGoogle, resetPassword, resendSignupConfirmation, supabase, updatePassword, isSupabaseConfigured } from '@/lib/supabase'
import { useSEO } from '@/hooks/useSEO'
import toast from 'react-hot-toast'

type Mode = 'login' | 'register' | 'forgot' | 'reset'
type LoginForm    = { email: string; password: string }
type RegisterForm = { name: string; email: string; password: string; confirm: string; agree: boolean }
type ResetForm    = { password: string; confirm: string }

export default function Auth() {
  const [sp] = useSearchParams()
  const [mode, setMode] = useState<Mode>((sp.get('mode') as Mode) || 'login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState('')
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [resetSessionReady, setResetSessionReady] = useState(false)
  const [resetSessionError, setResetSessionError] = useState('')
  const [forgotCooldownSec, setForgotCooldownSec] = useState(0)
  const registerScrollYRef = useRef(0)
  const navigate = useNavigate()

  const loginForm  = useForm<LoginForm>()
  const regForm    = useForm<RegisterForm>()
  const resetForm  = useForm<ResetForm>()

  const ensureSupabaseConfigured = () => {
    if (isSupabaseConfigured) return true
    toast.error('Supabase не налаштований. Додайте VITE_SUPABASE_URL і VITE_SUPABASE_ANON_KEY у .env', { className: 'hot-toast' })
    return false
  }

  useSEO({
    title: mode === 'register' ? 'Реєстрація' : 'Вхід до акаунту',
    description: 'Увійдіть або зареєструйтесь в Біонеріка — відстежуйте замовлення, зберігайте улюблені вироби та отримуйте ексклюзивні пропозиції.',
    url: '/auth',
    noindex: true,
  })

  useEffect(() => {
    if (mode === 'reset') return

    const hash = window.location.hash || ''
    const hasRecoveryInHash = /type=recovery|access_token=|refresh_token=/i.test(hash)
    const code = sp.get('code')
    const type = sp.get('type')

    if (code && type === 'signup') {
      void (async () => {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          toast.error(error.message || 'Не вдалося підтвердити email', { className: 'hot-toast' })
          return
        }
        setEmailConfirmed(true)
        toast.success('Email успішно підтверджено! Тепер можна увійти.', { className: 'hot-toast', duration: 4000 })
      })()
      return
    }

    const hasRecoveryInQuery = type === 'recovery' || Boolean(code)

    if (hasRecoveryInHash || hasRecoveryInQuery) {
      setMode('reset')
    }

  }, [mode, sp])

  useEffect(() => {
    if (forgotCooldownSec <= 0) return
    const timer = window.setInterval(() => {
      setForgotCooldownSec(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [forgotCooldownSec])

  useEffect(() => {
    if (mode !== 'reset') return
    let cancelled = false

    const initRecoverySession = async () => {
      setResetSessionError('')
      setResetSessionReady(false)

      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        if (!cancelled) setResetSessionReady(true)
        return
      }

      const code = sp.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          if (!cancelled) setResetSessionReady(true)
          return
        }
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const hashType = hashParams.get('type')

      if (accessToken && refreshToken && hashType === 'recovery') {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          const cleanUrl = `${window.location.pathname}${window.location.search}`
          window.history.replaceState({}, '', cleanUrl)
          if (!cancelled) setResetSessionReady(true)
          return
        }
      }

      if (!cancelled) {
        setResetSessionError('Сесія відновлення недійсна або прострочена. Запросіть нове посилання.')
      }
    }

    void initRecoverySession()

    return () => {
      cancelled = true
    }
  }, [mode, sp])

  const handleGoogle = async () => {
    if (!ensureSupabaseConfigured()) return
    const { error } = await signInGoogle()
    if (error) toast.error('Помилка входу через Google', { className: 'hot-toast' })
  }

  const onLogin = async (d: LoginForm) => {
    const email = d.email.trim().toLowerCase()
    const password = d.password

    if (!email || !password) {
      toast.error('Введіть email та пароль', { className: 'hot-toast' })
      return
    }
    if (!ensureSupabaseConfigured()) return

    setLoading(true)
    const { error } = await signInEmail(email, password)
    setLoading(false)

    if (error) {
      const message = (error.message || '').toLowerCase()

      if (message.includes('email not confirmed') || message.includes('not confirmed')) {
        const { error: resendError } = await resendSignupConfirmation(email)
        if (resendError) {
          toast.error('Email не підтверджено. Не вдалося повторно надіслати лист.', { className: 'hot-toast' })
        } else {
          toast.error('Email не підтверджено. Надіслали новий лист для підтвердження.', { className: 'hot-toast', duration: 6000 })
        }
        return
      }

      if (message.includes('invalid login credentials')) {
        toast.error('Невірний email або пароль. Якщо акаунт створювали в старій БД - зареєструйтесь знову.', { className: 'hot-toast' })
        return
      }

      toast.error(error.message || 'Помилка входу', { className: 'hot-toast' })
    } else {
      toast.success('Вітаємо! Ви увійшли.', { className: 'hot-toast' })
      navigate('/account')
    }
  }

  const onRegister = async (d: RegisterForm) => {
    if (d.password !== d.confirm) {
      regForm.setError('confirm', { message: 'Паролі не збігаються' })
      return
    }
    if (!ensureSupabaseConfigured()) return
    registerScrollYRef.current = window.scrollY
    setLoading(true)
    const email = d.email.trim().toLowerCase()
    const name = d.name.trim()
    const { error } = await signUpEmail(email, d.password, name)
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Помилка реєстрації', { className: 'hot-toast' })
    } else {
      setEmailSent(email)
      requestAnimationFrame(() => {
        window.scrollTo({ top: registerScrollYRef.current, left: 0, behavior: 'auto' })
      })
    }
  }

  /* ── Set new password (after reset link) ── */
  const onReset = async (d: ResetForm) => {
    if (d.password !== d.confirm) {
      resetForm.setError('confirm', { message: 'Паролі не збігаються' })
      return
    }
    if (!ensureSupabaseConfigured()) return
    if (!resetSessionReady) {
      toast.error('Немає активної recovery-сесії. Запросіть нове посилання.', { className: 'hot-toast' })
      return
    }
    setLoading(true)
    const { error } = await updatePassword(d.password)
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Помилка зміни пароля', { className: 'hot-toast' })
    } else {
      toast.success('Пароль успішно змінено!', { className: 'hot-toast', duration: 4000 })
      navigate('/account')
    }
  }

  /* ── Email confirmed screen ── */
  if (emailConfirmed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--b0)', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'rgba(74, 140, 63, 0.1)', border: '1px solid rgba(74, 140, 63, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 32 }}>
            ✓
          </div>

          <p style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
            Успіх
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,5vw,42px)', fontWeight: 300, color: 'var(--t0)', lineHeight: 1.15, marginBottom: 16 }}>
            Email<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-l)' }}>підтверджено</em>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.8, marginBottom: 32 }}>
            Ваш акаунт активний. Тепер виконайте вхід, щоб отримати доступ до особистого кабінету.
          </p>

          <button
            onClick={() => { setEmailConfirmed(false); setMode('login') }}
            className="btn-dark"
            style={{ width: '100%', marginBottom: 12 }}
          >
            Перейти до входу
          </button>
          <button
            onClick={() => { setEmailConfirmed(false); setMode('register') }}
            style={{ background: 'none', border: '1px solid var(--bd)', padding: '12px 20px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--t2)', fontFamily: 'Jost, sans-serif', cursor: 'pointer', width: '100%' }}
          >
            Зареєструватись знову
          </button>
        </div>
      </div>
    )
  }

  /* ── Email confirmation screen ── */
  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--b0)', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          {/* Icon */}
          <div style={{ width: 72, height: 72, background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 32 }}>
            📧
          </div>

          <p style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
            Майже готово
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,5vw,42px)', fontWeight: 300, color: 'var(--t0)', lineHeight: 1.15, marginBottom: 16 }}>
            Підтвердіть вашу<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-l)' }}>електронну пошту</em>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.8, marginBottom: 8 }}>
            Ми надіслали листа на адресу:
          </p>
          <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: '12px 20px', marginBottom: 28, display: 'inline-block' }}>
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 15, color: 'var(--t0)', letterSpacing: 0.5 }}>{emailSent}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.75, marginBottom: 32 }}>
            Перейдіть за посиланням у листі щоб активувати акаунт.<br />
            Не отримали? Перевірте папку «Спам» або «Промоакції».
          </p>

          {/* Steps */}
          <div style={{ textAlign: 'left', background: 'var(--b1)', border: '1px solid var(--bd)', padding: '20px 24px', marginBottom: 28 }}>
            {[
              ['1', 'Відкрийте листа від Біонеріка'],
              ['2', 'Натисніть кнопку «Підтвердити email»'],
              ['3', 'Автоматично повернетесь на сайт'],
            ].map(([n, text]) => (
              <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'center', paddingBlock: 10, borderBottom: n !== '3' ? '1px solid var(--bd)' : 'none' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--gold)', flexShrink: 0 }}>{n}</div>
                <span style={{ fontSize: 13, color: 'var(--t1)' }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setEmailSent(''); setMode('login') }}
              className="btn-dark"
              style={{ paddingInline: 28 }}
            >
              Увійти після підтвердження
            </button>
            <button
              onClick={() => setEmailSent('')}
              style={{ background: 'none', border: '1px solid var(--bd)', padding: '12px 20px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--t2)', fontFamily: 'Jost, sans-serif', cursor: 'pointer' }}
            >
              Спробувати знову
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)' }} className="lg:grid-cols-[1fr_1fr]">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-col relative overflow-hidden dark-section" style={{
        background: 'linear-gradient(135deg, #0f0d0a 0%, #1a1612 25%, #1f1612 50%, #1a2216 75%, #121612 100%)',
        backgroundAttachment: 'fixed',
      }}>
        {/* Gradient overlay — green/gold accent */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(74,140,63,0.08) 0%, rgba(201,169,110,0.04) 40%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div className="absolute inset-0 orn-bg opacity-[0.07]" />
        <div className="relative z-[1] p-10 flex flex-col h-full">
          <Link to="/" className="flex items-center gap-3 mb-auto" style={{ color: 'var(--gold-l)' }}>
            <ArrowLeft size={16} />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, letterSpacing: 3 }}>Біонеріка</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1.1, marginBottom: 20 }}>
              Ваш особистий<br /><em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>простір</em>
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(245,240,232,0.45)', maxWidth: 380 }}>
              Стежте за замовленнями, зберігайте улюблені вироби та отримуйте ексклюзивні пропозиції.
            </p>
          </div>

          {/* Testimonial */}
          <div className="mt-auto p-6" style={{ border: '1px solid rgba(201,169,110,0.22)' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontStyle: 'italic', color: 'rgba(245,240,232,0.93)', lineHeight: 1.5, marginBottom: 12 }}>
              "Кожна вишиванка — це оповідь. А ми — лише оповідачі."
            </p>
            <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)' }}>— Ганна Петрівна, засновниця</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col justify-center px-5 sm:px-8 lg:px-16 xl:px-24 py-12 sm:py-16" style={{ background: 'var(--b0)' }}>
        {/* Mobile back */}
        <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden" style={{ fontSize: 12, letterSpacing: 2, color: 'var(--t2)' }}>
          <ArrowLeft size={14} /> До сайту
        </Link>

        <div className="max-w-sm w-full mx-auto">
          {/* Mode tabs — only show for login/register; show back button for forgot/reset */}
          {(mode === 'login' || mode === 'register') ? (
            <div className="flex gap-0 mb-12" style={{ borderBottom: '1px solid var(--bd)' }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{
                    background: 'none', border: 'none', padding: '10px 20px 12px',
                    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                    color: mode === m ? 'var(--t0)' : 'var(--t2)',
                    borderBottom: `2px solid ${mode === m ? 'var(--gold)' : 'transparent'}`,
                    marginBottom: -1, cursor: 'pointer',
                  }}>
                  {m === 'login' ? 'Увійти' : 'Реєстрація'}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setMode('login')} className="flex items-center gap-2 mb-8"
              style={{ background: 'none', border: 'none', fontSize: 12, letterSpacing: 2, color: 'var(--t2)', cursor: 'pointer', textTransform: 'uppercase' }}>
              <ArrowLeft size={13} /> До входу
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={mode}
              initial={{ opacity: 0, x: mode === 'register' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,44px)', fontWeight: 300, color: 'var(--t0)', marginBottom: 32 }}>
                {mode === 'login'    ? 'Вхід до кабінету'
                : mode === 'register' ? 'Створити акаунт'
                : mode === 'reset'    ? 'Новий пароль'
                : 'Відновити пароль'}
              </h1>

              {/* Google OAuth */}
              {(mode === 'login' || mode === 'register') && (
                <>
                  <button onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 py-3.5 mb-6 transition-all"
                    style={{ border: '1px solid var(--bd)', background: 'var(--b1)', fontSize: 13, color: 'var(--t0)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Продовжити з Google
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
                    <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--t2)' }}>або</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
                  </div>
                </>
              )}

              {/* Login form */}
              {mode === 'login' && (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-7">
                  <div className="field-wrap">
                    <label className="field-label">Email</label>
                    <input type="email" placeholder="your@email.com" className="field-input"
                      autoComplete="email"
                      {...loginForm.register('email', { required: true })} />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Пароль</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="field-input pr-10"
                        autoComplete="current-password"
                        {...loginForm.register('password', { required: true, minLength: 6 })} />
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t2)' }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 6, letterSpacing: 0.3 }}>
                      Підказка: браузер запропонує збережений пароль — оберіть його із списку або введіть вручну.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setMode('forgot')}
                      style={{ fontSize: 12, color: 'var(--gold-d)', background: 'none', border: 'none', letterSpacing: 1 }}>
                      Забули пароль?
                    </button>
                  </div>
                  <button type="submit" disabled={loading} className="btn-dark justify-center" style={{ marginTop: 4 }}>
                    {loading ? 'Завантаження...' : 'Увійти →'}
                  </button>
                </form>
              )}

              {/* Register form */}
              {mode === 'register' && (
                <form onSubmit={regForm.handleSubmit(onRegister)} className="flex flex-col gap-6">
                  <div className="field-wrap">
                    <label className="field-label">Повне ім'я</label>
                    <input type="text" placeholder="Оксана Коваленко" className="field-input"
                      autoComplete="name"
                      {...regForm.register('name', { required: true })} />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Email</label>
                    <input type="email" placeholder="your@email.com" className="field-input"
                      autoComplete="email"
                      {...regForm.register('email', { required: true })} />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Пароль (мін. 8 символів)</label>
                    <input type="password" placeholder="••••••••" className="field-input"
                      autoComplete="new-password"
                      {...regForm.register('password', { required: true, minLength: 8 })} />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Підтвердити пароль</label>
                    <input type="password" placeholder="••••••••" className="field-input"
                      autoComplete="new-password"
                      {...regForm.register('confirm', { required: true })} />
                    {regForm.formState.errors.confirm && (
                      <p style={{ fontSize: 12, color: 'var(--rose)', marginTop: 4 }}>
                        {regForm.formState.errors.confirm.message}
                      </p>
                    )}
                  </div>
                  <label className="flex items-start gap-3" style={{ fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
                    <input type="checkbox" {...regForm.register('agree', { required: true })} style={{ marginTop: 2, accentColor: 'var(--gold)' }} />
                    Погоджуюсь з <Link to="/terms" style={{ color: 'var(--gold-d)', textDecoration: 'underline' }}>умовами використання</Link> та <Link to="/privacy" style={{ color: 'var(--gold-d)', textDecoration: 'underline' }}>політикою конфіденційності</Link>
                  </label>
                  <button type="submit" disabled={loading} className="btn-dark justify-center">
                    {loading ? 'Завантаження...' : 'Зареєструватись →'}
                  </button>
                </form>
              )}

              {/* Forgot password */}
              {mode === 'forgot' && (
                <form className="flex flex-col gap-7" onSubmit={async (e) => {
                  e.preventDefault()
                  if (forgotCooldownSec > 0) {
                    toast.error(`Зачекайте ${forgotCooldownSec}с перед повторною відправкою`, { className: 'hot-toast' })
                    return
                  }
                  const email = (e.currentTarget.querySelector('input[type=email]') as HTMLInputElement)?.value?.trim().toLowerCase()
                  if (!email) return
                  setLoading(true)
                  const { error } = await resetPassword(email)
                  setLoading(false)
                  if (error) {
                    const message = error.message || 'Помилка надсилання листа'
                    if (/rate limit|too many requests|email rate limit exceeded/i.test(message)) {
                      setForgotCooldownSec(60)
                      toast.error('Ліміт листів вичерпано. Спробуйте ще раз через 60 секунд.', { className: 'hot-toast' })
                    } else {
                      toast.error(message, { className: 'hot-toast' })
                    }
                  } else {
                    setForgotCooldownSec(60)
                    toast.success('Посилання надіслано! Перевірте пошту.', { className: 'hot-toast', duration: 6000 })
                    setMode('login')
                  }
                }}>
                  <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.7 }}>
                    Введіть ваш email і ми надішлемо посилання для відновлення паролю.
                  </p>
                  <div className="field-wrap">
                    <label className="field-label">Email</label>
                    <input type="email" placeholder="your@email.com" className="field-input" required />
                  </div>
                  <button type="submit" disabled={loading || forgotCooldownSec > 0} className="btn-dark justify-center">
                    {loading ? 'Надсилаємо...' : forgotCooldownSec > 0 ? `Повтор через ${forgotCooldownSec}с` : 'Надіслати посилання →'}
                  </button>
                  <button type="button" onClick={() => setMode('login')} className="btn-ghost justify-center">
                    ← Повернутись до входу
                  </button>
                </form>
              )}

              {/* Set new password (after clicking reset link in email) */}
              {mode === 'reset' && (
                <form className="flex flex-col gap-7" onSubmit={resetForm.handleSubmit(onReset)}>
                  <div style={{ padding: '12px 16px', background: resetSessionError ? 'rgba(217,108,108,0.1)' : 'rgba(138,158,140,0.1)', border: resetSessionError ? '1px solid rgba(217,108,108,0.3)' : '1px solid rgba(138,158,140,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{resetSessionError ? '!' : '✓'}</span>
                    <p style={{ fontSize: 13, color: resetSessionError ? 'var(--rose)' : 'var(--sage)' }}>
                      {resetSessionError || (resetSessionReady ? 'Посилання підтверджено. Введіть новий пароль.' : 'Перевіряємо recovery-сесію...')}
                    </p>
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Новий пароль</label>
                    <input
                      type="password"
                      placeholder="Мінімум 8 символів"
                      className="field-input"
                      {...resetForm.register('password', { required: true, minLength: { value: 8, message: 'Мінімум 8 символів' } })}
                    />
                    {resetForm.formState.errors.password && (
                      <p style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>{resetForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Повторіть пароль</label>
                    <input
                      type="password"
                      placeholder="Введіть пароль ще раз"
                      className="field-input"
                      {...resetForm.register('confirm', { required: true })}
                    />
                    {resetForm.formState.errors.confirm && (
                      <p style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>{resetForm.formState.errors.confirm.message}</p>
                    )}
                  </div>
                  <button type="submit" disabled={loading || !resetSessionReady} className="btn-dark justify-center">
                    {loading ? 'Збереження...' : 'Зберегти новий пароль →'}
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
