import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingBag, Heart, User, X, Menu, LogOut, Settings, Package, ChevronDown, Shield } from 'lucide-react'
import { useCart, useAuth, useWishlist, useUi } from '@/store'
import { signOut } from '@/lib/supabase'
import { useSitePresence } from '@/hooks/useSitePresence'
import { products } from '@/data'
import CategoryIcon from '@/components/ui/CategoryIcon'

const mainNav = [
  { to: '/catalog', label: 'Каталог', sub: [
    { to: '/catalog?cat=berries', label: 'Ягоди', icon: 'berries' as const },
    { to: '/catalog?cat=fruits', label: 'Фрукти', icon: 'fruits' as const },
    { to: '/catalog?cat=vegetables', label: 'Овочі', icon: 'vegetables' as const },
    { to: '/catalog?cat=greens', label: 'Зелень', icon: 'greens' as const },
    { to: '/catalog?cat=plants', label: 'Розсада', icon: 'plants' as const },
    { to: '/catalog?cat=baskets', label: 'Подарункові набори', icon: 'baskets' as const },
  ]},
  { to: '/story', label: 'Як ми вирощуємо' },
  { to: '/blog', label: 'Блог' },
  { to: '/delivery', label: 'Доставка' },
  { to: '/contact', label: 'Контакти', sub: [
    { to: '/contact', label: 'Написати нам' },
    { to: '/faq', label: 'FAQ' },
    { to: '/partners', label: 'Оптовикам' },
  ]},
]

function BrandMark() {
  // TODO: замените /logo.png на путь к вашему PNG-логотипу
  return (
    <img
      src="/logo.png"
      alt="Bionerica logo"
      width={38}
      height={38}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}

export default function Navbar() {
  const { count, open: openCart } = useCart()
  const wishCount = useWishlist(s => s.count())
  const { user, profile, logout } = useAuth()
  const { searchOpen, toggleSearch, setSearch, searchQuery } = useUi()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false)
  const [mobileWishlistOpen, setMobileWishlistOpen] = useState(false)
  const [mobileSectionOpen, setMobileSectionOpen] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { onlineNow } = useSitePresence(user?.id)
  const wishlistIds = useWishlist(s => s.ids)
  const wishlistPreview = Array.from(wishlistIds)
    .map(id => products.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 5)

  const smartHubLinks = [
    { to: '/catalog', label: 'До каталогу' },
    { to: '/account/orders', label: 'Мої замовлення' },
    { to: '/account/chat', label: 'Чат менеджера' },
    { to: '/checkout', label: 'Оформлення' },
  ]

  const smartHint = location.pathname.startsWith('/catalog')
    ? 'Порада: відфільтруйте товари за категорією, щоб знайти швидше'
    : location.pathname.startsWith('/account')
      ? 'Порада: в Overview бачите realtime дані та персональні підказки'
      : location.pathname.startsWith('/checkout')
        ? 'Порада: у оффлайні замовлення автоматично стане в чергу'
        : 'Порада: використовуйте швидкі дії для навігації по сайту'
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`)
    toggleSearch()
    setSearch('')
  }

  const handleLogout = async () => {
    logout()
    try {
      await signOut()
    } catch {
      // Local logout already applied.
    }
    setUserMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileOpen(false)
    setMobileAccountOpen(false)
    setMobileWishlistOpen(false)
    setMobileSectionOpen(null)
  }

  const mobileRowStyle = {
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--t0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 0',
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    fontFamily: 'Jost, sans-serif',
    fontWeight: 400,
    textAlign: 'left' as const,
  }

  return (
    <>
      <motion.header
        className="sticky top-0 z-50"
        animate={{
          backgroundColor: scrolled ? 'var(--b0)' : 'var(--b0)',
          boxShadow: scrolled ? '0 1px 0 var(--bd)' : 'none',
        }}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        transition={{ backgroundColor: { duration: 0.3 }, boxShadow: { duration: 0.3 } }}
      >
        <div className="page-wrap">
          <div className="flex items-center justify-between gap-4 py-5">

            {/* Mobile menu toggle */}
            <button className="lg:hidden order-last" style={{ color: 'var(--t0)', background: 'none', border: 'none' }}
              onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>

            {/* Logo — Bionerica */}
            <Link to="/" className="flex-shrink-0 group min-w-0">
              <div className="flex items-center gap-3" style={{ lineHeight: 1 }}>
                <div style={{ flexShrink: 0, transform: 'translateY(-1px)' }}>
                  <BrandMark />
                </div>
                <div className="min-w-0">
                  <div style={{
                    fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif',
                    fontSize: 'clamp(20px, 5vw, 28px)',
                    fontWeight: 700,
                    letterSpacing: '-0.035em',
                    color: 'var(--t0)',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap',
                  }}>
                    Bio<span style={{ color: 'var(--gold)' }}>nerica</span>
                  </div>
                  <div style={{ fontSize: 8, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'var(--t2)', marginTop: 3, whiteSpace: 'nowrap' }}>
                    ФЕРМА&thinsp;·&thinsp;ОРГАНІКА&thinsp;·&thinsp;UA
                  </div>
                </div>
              </div>
            </Link>

            {/* Desktop nav — centered */}
            <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              {mainNav.map(link => (
                <div key={link.to}
                  className="relative"
                  onMouseEnter={() => link.sub && setActiveDropdown(link.to)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <NavLink to={link.to}
                    style={({ isActive }) => ({
                      fontSize: 11,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: isActive ? 'var(--t0)' : 'var(--t1)',
                      paddingBottom: 6,
                      transition: 'color 0.25s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      position: 'relative',
                    })}
                    className="hover:text-[var(--t0)]"
                  >
                    {({ isActive }) => (
                      <>
                        {link.label}
                        {link.sub && <ChevronDown size={11} />}
                        {isActive && (
                          <motion.span
                            layoutId="nav-underline"
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 1,
                              background: 'var(--gold)',
                              borderRadius: 1,
                            }}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {link.sub && activeDropdown === link.to && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.16 }}
                        className="absolute top-full left-0 mt-2 z-50 min-w-[180px]"
                        style={{ background: 'var(--b0)', border: '1px solid var(--bd)', boxShadow: 'var(--sh)' }}
                      >
                        {link.sub.map(s => (
                          <Link key={s.to} to={s.to}
                            onClick={() => setActiveDropdown(null)}
                            className="block px-5 py-3 text-[12px] tracking-wide transition-all"
                            style={{ color: 'var(--t1)' }}
                            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--b1)'; (e.target as HTMLElement).style.color = 'var(--t0)' }}
                            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; (e.target as HTMLElement).style.color = 'var(--t1)' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                              {'icon' in s && s.icon ? <CategoryIcon id={s.icon} size={14} mode="line" /> : null}
                              <span>{s.label}</span>
                            </span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-4 ml-auto">
              {/* Search */}
              <button onClick={toggleSearch}
                style={{ background: 'none', border: 'none', color: 'var(--t0)' }}
                className="hover:text-[var(--gold)] transition-colors">
                <Search size={19} />
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative hover:text-[var(--gold)] transition-colors" style={{ color: 'var(--t0)' }}>
                <Heart size={19} />
                {wishCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                    style={{ background: 'var(--rose)', color: 'white' }}>
                    {wishCount}
                  </span>
                )}
              </Link>

              {/* User */}
              <div className="relative">
                <button onClick={() => setUserMenuOpen(o => !o)}
                  style={{ background: 'none', border: 'none', color: 'var(--t0)' }}
                  className="hover:text-[var(--gold)] transition-colors flex items-center gap-2">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" style={{ border: '1px solid var(--bd)' }} />
                    : <User size={19} />
                  }
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 z-50 w-56"
                      style={{ background: 'var(--b0)', border: '1px solid var(--bd)', boxShadow: 'var(--sh)' }}
                    >
                      {user ? (
                        <>
                          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bd)', background: 'var(--b1)' }}>
                            <p style={{ fontSize: 14, color: 'var(--t0)', marginBottom: 2 }}>{profile?.full_name || 'Вітаємо!'}</p>
                            <p style={{ fontSize: 11, color: 'var(--t2)' }}>{user.email}</p>
                            {profile?.loyalty_points !== undefined && (
                              <p className="mt-2" style={{ fontSize: 10, letterSpacing: 2, color: 'var(--gold)' }}>
                                ✦ {profile.loyalty_points} балів
                              </p>
                            )}
                          </div>
                          {[
                            { to: '/account', icon: User, label: 'Особистий кабінет' },
                            { to: '/account/orders', icon: Package, label: 'Мої замовлення' },
                            { to: '/account/settings', icon: Settings, label: 'Налаштування' },
                            ...(profile?.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Адмін-панель' }] : []),
                          ].map(item => (
                            <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-5 py-3 text-[13px] transition-all w-full"
                              style={{ color: 'var(--t1)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--b1)'; (e.currentTarget as HTMLElement).style.color = 'var(--t0)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--t1)' }}
                            >
                              <item.icon size={14} /> {item.label}
                            </Link>
                          ))}
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 px-5 py-3 text-[13px] w-full transition-all"
                            style={{ background: 'none', border: 'none', color: 'var(--rose)', textAlign: 'left', borderTop: '1px solid var(--bd)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--b1)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                          >
                            <LogOut size={14} /> Вийти
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to="/auth" onClick={() => setUserMenuOpen(false)}
                            className="block px-5 py-4 text-[13px] transition-all"
                            style={{ color: 'var(--t0)', borderBottom: '1px solid var(--bd)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--b1)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                          >Увійти</Link>
                          <Link to="/auth?mode=register" onClick={() => setUserMenuOpen(false)}
                            className="block px-5 py-4 text-[13px] transition-all"
                            style={{ color: 'var(--t1)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--b1)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                          >Реєстрація</Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <button onClick={openCart}
                className="relative hover:text-[var(--gold)] transition-colors"
                style={{ background: 'none', border: 'none', color: 'var(--t0)' }}>
                <ShoppingBag size={19} />
                {count() > 0 && (
                  <motion.span
                    key={count()}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                    style={{ background: 'var(--gold)', color: 'var(--b-inv)' }}
                  >
                    {count()}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 68 }}
              exit={{ height: 0 }}
              className="overflow-hidden"
              style={{ borderTop: '1px solid var(--bd)', background: 'var(--b0)' }}
            >
              <form onSubmit={handleSearch} className="page-wrap h-full flex items-center gap-4">
                <Search size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Шукайте ягоди, овочі, зелень або розсаду..."
                  className="flex-1 bg-transparent border-none outline-none"
                  style={{ fontSize: 14, color: 'var(--t0)', fontFamily: 'Jost, sans-serif' }}
                />
                <button type="button" onClick={() => { toggleSearch(); setSearch('') }}
                  style={{ background: 'none', border: 'none', color: 'var(--t2)' }}>
                  <X size={16} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-[80]" style={{ background: 'rgba(0,0,0,0.52)' }}
              onClick={closeMobileMenu} />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.85 }}
              className="fixed top-0 left-0 bottom-0 z-[90] flex flex-col"
              style={{ width: 'min(320px, 88vw)', background: 'var(--b0)', borderRight: '1px solid var(--bd)' }}
            >
              <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
                <div className="flex items-center gap-3">
                  <BrandMark />
                  <span style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>
                    Bio<span style={{ color: 'var(--gold)' }}>nerica</span>
                  </span>
                </div>
                <button onClick={closeMobileMenu} style={{ background: 'none', border: 'none', color: 'var(--t0)' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
                <Link to="/catalog" onClick={closeMobileMenu} className="flex items-center justify-between gap-3 px-0 py-2" style={{ color: 'var(--t0)', textDecoration: 'none' }}>
                  <span style={{ fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Jost, sans-serif' }}>Пошук і каталог</span>
                  <Search size={16} />
                </Link>
                <Link to="/cart" onClick={closeMobileMenu} className="flex items-center justify-between gap-3 px-0 py-2" style={{ color: 'var(--t0)', textDecoration: 'none' }}>
                  <span style={{ fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Jost, sans-serif' }}>Кошик</span>
                  <ShoppingBag size={16} />
                </Link>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-4">
                {mainNav.map(link => (
                  <div key={link.to} className="mb-1">
                    {link.sub ? (
                      <>
                        <button
                          onClick={() => setMobileSectionOpen(open => open === link.to ? null : link.to)}
                          style={{
                            ...mobileRowStyle,
                            borderBottom: '1px solid var(--bd)',
                          }}
                        >
                          <span>{link.label}</span>
                          <ChevronDown size={14} style={{ transform: mobileSectionOpen === link.to ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
                        </button>
                        <AnimatePresence initial={false}>
                          {mobileSectionOpen === link.to && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="pl-3 pb-1 pt-2">
                                {link.sub.map(s => (
                                  <Link key={s.to} to={s.to} onClick={closeMobileMenu}
                                    className="block py-1.5 text-[12px] tracking-wide transition-colors"
                                    style={{ color: 'var(--t2)' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                      {'icon' in s && s.icon ? <CategoryIcon id={s.icon} size={13} mode="line" /> : null}
                                      <span>{s.label}</span>
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <NavLink to={link.to} onClick={closeMobileMenu}
                        style={({ isActive }) => ({
                          ...mobileRowStyle,
                          color: isActive ? 'var(--t0)' : 'var(--t2)',
                          borderBottom: '1px solid var(--bd)',
                        })}>
                        {link.label}
                      </NavLink>
                    )}
                  </div>
                ))}

                {/* Compact accordion: account */}
                <div style={{ borderBottom: '1px solid var(--bd)', marginTop: 6 }}>
                  <button
                    onClick={() => setMobileAccountOpen(v => !v)}
                    style={{
                      ...mobileRowStyle,
                      color: 'var(--t0)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <User size={14} /> Кабінет
                    </span>
                    <ChevronDown size={14} style={{ transform: mobileAccountOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileAccountOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden', paddingBottom: 8 }}
                      >
                        {user ? (
                          <>
                            <Link to="/account" onClick={closeMobileMenu} className="block py-1.5 pl-1 text-[12px]" style={{ color: 'var(--t1)' }}>
                              Особистий кабінет
                            </Link>
                            <Link to="/account/orders" onClick={closeMobileMenu} className="block py-1.5 pl-1 text-[12px]" style={{ color: 'var(--t1)' }}>
                              Мої замовлення
                            </Link>
                            <Link to="/account/settings" onClick={closeMobileMenu} className="block py-1.5 pl-1 text-[12px]" style={{ color: 'var(--t1)' }}>
                              Налаштування
                            </Link>
                            {profile?.role === 'admin' && (
                              <Link to="/admin" onClick={closeMobileMenu} className="block py-1.5 pl-1 text-[12px]" style={{ color: 'var(--t1)' }}>
                                Адмін-панель
                              </Link>
                            )}
                            <button
                              onClick={async () => { await handleLogout(); closeMobileMenu() }}
                              style={{ background: 'none', border: 'none', color: 'var(--berry)', padding: '8px 0 4px 4px', fontSize: 12, textAlign: 'left' }}
                              className="w-full"
                            >
                              Вийти
                            </button>
                          </>
                        ) : (
                          <>
                            <Link to="/auth" onClick={closeMobileMenu} className="block py-1.5 pl-1 text-[12px]" style={{ color: 'var(--t1)' }}>
                              Увійти
                            </Link>
                            <Link to="/auth?mode=register" onClick={closeMobileMenu} className="block py-1.5 pl-1 text-[12px]" style={{ color: 'var(--t1)' }}>
                              Реєстрація
                            </Link>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Compact accordion: wishlist */}
                <div style={{ borderBottom: '1px solid var(--bd)' }}>
                  <button
                    onClick={() => setMobileWishlistOpen(v => !v)}
                    style={{
                      ...mobileRowStyle,
                      color: 'var(--t0)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Heart size={14} /> Обране {wishCount > 0 ? `(${wishCount})` : ''}
                    </span>
                    <ChevronDown size={14} style={{ transform: mobileWishlistOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileWishlistOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden', paddingBottom: 8 }}
                      >
                        {wishlistPreview.length > 0 ? (
                          <>
                            {wishlistPreview.map(product => (
                              <Link
                                key={product.id}
                                to={`/product/${product.slug}`}
                                onClick={closeMobileMenu}
                                className="block py-1.5 pl-1 text-[12px]"
                                style={{ color: 'var(--t1)' }}
                              >
                                {product.name_uk}
                              </Link>
                            ))}
                            <Link to="/wishlist" onClick={closeMobileMenu} className="block pt-2 pl-1 text-[11px]" style={{ color: 'var(--gold-d)', letterSpacing: 1.3, textTransform: 'uppercase' }}>
                              Дивитись все
                            </Link>
                          </>
                        ) : (
                          <p style={{ fontSize: 12, color: 'var(--t2)', padding: '2px 0 8px 4px' }}>
                            У списку поки немає товарів
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              <div className="px-4 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--bd)' }}>
                <span className="label-xs" style={{ marginBottom: 0 }}>bionerica.ua</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
