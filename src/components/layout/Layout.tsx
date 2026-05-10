// src/components/layout/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import { useLayoutEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import CartDrawer from './CartDrawer'
import { NavigationProgress } from '@/components/ui/NavigationProgress'
import { PageCurtain } from '@/components/ui/PageCurtain'

export default function Layout() {
  const location = useLocation()
  const { pathname } = location
  const isAdmin = pathname.startsWith('/admin')

  // Runs before browser paint — scroll is reset before user sees new page
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <PageCurtain />
      <NavigationProgress />
      {!isAdmin && <Navbar />}
      {/*
        key={pathname} causes React to unmount/remount this div on every route change.
        The CSS class page-enter triggers a GPU-composited opacity fade.
        No JS animation library involved → zero overhead → no micro-freezes.
        minHeight:'100dvh' prevents footer from jumping while content loads.
      */}
      <div key={pathname} className="page-enter" style={{ minHeight: '100dvh' }}>
        <main>
          <Outlet />
        </main>
      </div>
      {!isAdmin && <Footer />}
      <CartDrawer />
    </>
  )
}
