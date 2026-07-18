import React, { useState, useEffect } from 'react'
import {FieldError,TextField} from "@heroui/react"
import { Link } from 'react-router'
import { useSelector } from 'react-redux'
import { useAuth } from '../hooks/useAuth'
import KineticTextLoader from '../../../components/ui/kinetic-text-loader'
import AnimatedButton from '../../../components/ui/animated-button'
import GoogleSignInButton from '../../../components/ui/google-signin-button'
import { useModeAnimation, ThemeAnimationType } from 'react-theme-switch-animation'
import { Moon, Sun } from 'lucide-react'

const Register = () => {
  const [username, setUsername] = useState('')

  useEffect(() => {
    document.body.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
    };
  }, []);
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isUsernameInvalid = username.length > 0 && username.length < 3;
  const isPasswordInvalid = password.length > 0 && password.length<6;

  const loading = useSelector(state => state.auth.loading)
  const error = useSelector(state => state.auth.error)
  const sessionChecked = useSelector(state => state.auth.sessionChecked)

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[color:var(--bg-app)] text-[color:var(--text-primary)]">
        <KineticTextLoader text="LOADING" />
      </div>
    )
  }

  const { handleRegister } = useAuth()

  const { ref, toggleSwitchTheme, isDarkMode } = useModeAnimation({
    animationType: ThemeAnimationType.QR_SCAN,
    duration: 700,
  })

  const submitForm = async (event) => {
    event.preventDefault()

    if (isUsernameInvalid || isPasswordInvalid) {
      return
    }

    const payload = {
      username,
      email,
      password,
    }

    const success = await handleRegister(payload)
    if (success) {
      setSubmitted(true)
    }
  }

  if (submitted && !error) {
    return (
      <section className="relative min-h-screen bg-[color:var(--bg-app)] px-4 py-10 text-[color:var(--text-primary)] sm:px-6 lg:px-8">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <button
            ref={ref}
            onClick={toggleSwitchTheme}
            aria-label="Toggle theme"
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[color:var(--text-secondary)] transition hover:bg-black/10 hover:text-[color:var(--text-primary)] dark:hover:bg-white/10"
          >
            {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
        <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
          <div className="w-full max-w-md rounded-[5px] border border-brand-400/30 bg-[color:var(--bg-surface)] p-6 text-center shadow-2xl shadow-black/10 dark:shadow-black/50 sm:p-8">
            <h1 className="text-2xl font-bold text-brand-500">Check your inbox</h1>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              We&apos;ve sent a verification link to <span className="text-[color:var(--text-primary)]">{email}</span>. Verify your email before logging in.
            </p>
            <Link to="/login">
              <AnimatedButton className="mt-6 w-full py-3">Go to Login</AnimatedButton>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-screen bg-[color:var(--bg-app)] px-4 py-10 text-[color:var(--text-primary)] sm:px-6 lg:px-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 transition hover:opacity-85">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-brand-400 text-zinc-950 font-bold">K</div>
                        <span className="text-lg font-semibold tracking-tight">Kairis AI</span>
                    </Link>
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <button ref={ref} onClick={toggleSwitchTheme}>
          {isDarkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      </div>

      <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-[5px] border border-brand-400/30 bg-[color:var(--bg-surface)] p-6 shadow-2xl shadow-black/10 dark:shadow-black/50 sm:p-8">
          

          <h1 className="text-2xl font-bold text-brand-500 sm:text-3xl">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
            Register with your username, email, and password.
          </p>

          

          <form onSubmit={submitForm} className="mt-8 space-y-5">
            <div>
              <TextField className="w-full" isInvalid={isUsernameInvalid}>
              <label htmlFor="username" className="mb-2 block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Choose a username"
                required
                className="w-full rounded-[5px] border border-black/10 dark:border-white/15 bg-transparent px-4 py-3 outline-none ring-0 transition placeholder:text-[color:var(--text-secondary)] focus:border-brand-400 focus:shadow-[0_0_0_3px_rgba(248,147,79,0.2)]"
              />
              <FieldError>Username must be at least 3 characters</FieldError>
              </TextField>
            </div>

            <div>
              
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-[5px] border border-black/10 dark:border-white/15 bg-transparent px-4 py-3 outline-none ring-0 transition placeholder:text-[color:var(--text-secondary)] focus:border-brand-400 focus:shadow-[0_0_0_3px_rgba(248,147,79,0.2)]"
              />
              
            </div>

            <div>
              <TextField className="w-full" isInvalid={isPasswordInvalid}>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                required
                className="w-full rounded-[5px] border border-black/10 dark:border-white/15 bg-transparent px-4 py-3 outline-none ring-0 transition placeholder:text-[color:var(--text-secondary)] focus:border-brand-400 focus:shadow-[0_0_0_3px_rgba(248,147,79,0.2)]"
              />
              <FieldError>Password must be at least 6 characters</FieldError>
              </TextField>
            </div>
            
            {error && (
            <div role="alert" className="mt-4 rounded-[5px] border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-500 dark:text-red-300">
              {error}
            </div>
          )}

            <AnimatedButton
              type="submit"
              disabled={loading}
              className="w-full py-3 text-base disabled:opacity-60"
            >
              {loading ? 'Account ban raha hai...' : 'Register'}
            </AnimatedButton>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[color:var(--border-subtle)]" />
            <span className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">or</span>
            <div className="h-px flex-1 bg-[color:var(--border-subtle)]" />
          </div>

          <GoogleSignInButton label="Sign up with Google" />

          <p className="mt-6 text-center text-sm text-[color:var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-500 transition hover:text-brand-400">
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Register
