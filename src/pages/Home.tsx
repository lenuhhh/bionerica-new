import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Leaf, ShieldCheck, Truck, Star } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import LazyImage from '@/components/ui/LazyImage'
import { SectionTitle, ReviewsSlider } from '@/components/ui'
import { FadeIn } from '@/components/ui/FadeIn'
import CategoryIcon from '@/components/ui/CategoryIcon'
import { products, categories } from '@/data'
import { usePosts } from '@/hooks/useProducts'
import { useSEO, orgSchema } from '@/hooks/useSEO'
import NewsletterWidget from '@/components/ui/NewsletterWidget'

/* ── Marquee words ── */
const words = ['Полуниця', 'Черешня', 'Чорниця', 'Помідори черрі', 'Кавун', 'Органічна ферма', 'Свіжий збір', 'На замовлення']

/* ── Lightweight fade-in variant — single reusable config ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] },
})

export default function Home() {
  const editorialRef = useRef<HTMLElement>(null)
  const { scrollYProgress: editorialScroll } = useScroll({ target: editorialRef, offset: ['start end', 'end start'] })
  const editorialBgY = useTransform(editorialScroll, [0, 1], ['-15%', '15%'])

  const testimonialsRef = useRef<HTMLElement>(null)
  const { scrollYProgress: testimonialsScroll } = useScroll({ target: testimonialsRef, offset: ['start end', 'end start'] })
  const testimonialsBgY = useTransform(testimonialsScroll, [0, 1], ['-15%', '15%'])

  const newProducts = products.filter((p) => p.is_new)
  const featured = [...newProducts, ...products.filter((p) => !newProducts.some((np) => np.id === p.id))].slice(0, 4)
  const bestsellers = products.filter((p) => p.is_bestseller)
  const { posts: homePosts } = usePosts(4)

  useSEO({
    title: 'Свіжі ягоди, фрукти та овочі на замовлення',
    description: 'Замовляйте свіжі ягоди, фрукти, овочі та рослини прямо з нашої ферми. Органічне вирощування, доставка в день збору.',
    keywords: 'полуниця, черешня, чорниця, свіжі овочі, органічна ферма, Bionerica',
    schema: {
      ...orgSchema,
      name: 'Bionerica',
      url: 'https://bionerica.ua',
      description: 'Органічна ферма. Ягоди, фрукти, овочі та рослини на замовлення.',
    },
  })

  return (
    <>
      {/* ══════════════════════════════════
          HERO SECTION
      ══════════════════════════════════ */}
      <section
        style={{ minHeight: '100vh', background: 'var(--b1)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-start' }}
        aria-label="Головний банер"
      >
        {/* Subtle organic texture overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 65% 40%, rgba(74,140,63,0.6) 0%, transparent 70%)',
        }} />

        <div className="page-wrap relative z-[1]" style={{ paddingTop: 28, paddingBottom: 72 }}>
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 xl:gap-16 items-center">

            {/* ── Text column ── */}
            <div style={{ animation: 'fadeUpIn 0.7s cubic-bezier(.4,0,.2,1) both' }}>

              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                <span style={{ width: 28, height: 2, background: 'var(--gold)', display: 'block', borderRadius: 2 }} />
                <span style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
                  Органічна ферма · Власний збір · Доставка в день збору
                </span>
              </div>

              <h1 style={{
                fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif',
                fontWeight: 600,
                lineHeight: 1.05,
                color: 'var(--t1)',
                fontSize: 'clamp(44px, 6.5vw, 88px)',
                marginBottom: 24,
                animation: 'fadeUpIn 0.75s 0.1s cubic-bezier(.4,0,.2,1) both',
              }}>
                Свіжі ягоди<br />
                та овочі<br />
                <span style={{ color: 'var(--gold)' }}>з поля —</span><br />
                <span style={{ color: 'var(--berry)' }}>на ваш стіл</span>
              </h1>

              <p style={{
                fontSize: 16, lineHeight: 1.8, color: 'var(--t1)',
                maxWidth: 480, marginBottom: 40,
              }}>
                Bionerica — органічна ферма з Полтавщини. Полуниця, черешня, чорниця, помідори черрі, перець, зелень і розсада. Збирається вранці — доставляється того ж дня.
              </p>

              <div style={{
                display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
                marginBottom: 52,
                animation: 'fadeUpIn 0.7s 0.32s cubic-bezier(.4,0,.2,1) both',
              }}>
                <Link to="/catalog" className="btn-dark" style={{ background: 'var(--gold)', border: 'none', color: '#fff', borderRadius: 4 }}>
                  Замовити зараз <ArrowRight size={16} />
                </Link>
                <Link to="/catalog?cat=baskets" className="btn-outline">
                  Подарункові кошики
                </Link>
              </div>

              {/* Trust badges */}
              <div
                className="grid grid-cols-2 gap-4 lg:gap-6 w-full"
                style={{
                  borderTop: '1px solid var(--bd)',
                  paddingTop: 28,
                  animation: 'fadeUpIn 0.7s 0.42s cubic-bezier(.4,0,.2,1) both',
                }}
              >
                {[
                  { icon: <Leaf size={16} />, val: '100%', label: 'Органічне' },
                  { icon: <Truck size={16} />, val: 'В день збору', label: 'Доставка' },
                  { icon: <ShieldCheck size={16} />, val: '99%', label: 'Задоволених' },
                  { icon: <Star size={16} />, val: '4.9 ★', label: '800+ відгуків' },
                ].map(({ icon, val, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span
                      style={{
                        color: 'var(--gold-d)',
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(74,140,63,0.12)',
                        border: '1px solid rgba(74,140,63,0.22)',
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </span>
                    <div>
                      <span style={{
                        fontSize: 'clamp(14px, 1.8vw, 18px)',
                        fontWeight: 400, color: 'var(--t1)',
                        display: 'block', lineHeight: 1,
                      }}>{val}</span>
                      <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--t2)', marginTop: 3, display: 'block', fontWeight: 400 }}>{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Visual collage ── */}
            <div
              className="relative"
              style={{ animation: 'fadeInRight 0.9s 0.2s cubic-bezier(.4,0,.2,1) both' }}
            >
              {/* Main image */}
              <div className="relative" style={{ maxWidth: 620, margin: '32px auto 0', overflow: 'visible' }}>
                <div
                  style={{
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 28px 88px rgba(0,0,0,0.20)',
                  }}
                >
                  <LazyImage
                    src="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=700&h=820&fit=crop&q=85&fm=webp"
                    alt="Свіжа полуниця Bionerica"
                    aspectRatio="aspect-[5/6]"
                    priority
                    className="w-full"
                  />
                </div>

                {/* Floating thumbnail — anchored to left edge of main image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.55, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute',
                    left: '0%',
                    top: '72%',
                    transform: 'translate(-4%, -50%)',
                    width: '26%',
                    minWidth: 110,
                    maxWidth: 160,
                    border: '5px solid var(--b0)',
                    animation: 'float-y 8s 1.5s ease-in-out infinite',
                    boxShadow: '0 22px 52px rgba(0,0,0,0.24)',
                    borderRadius: 12,
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    zIndex: 10,
                  }}
                >
                  <LazyImage
                    src="https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=360&h=360&fit=crop&q=85&fm=webp"
                    alt="Черешня Bionerica"
                    aspectRatio="aspect-square"
                  />
                </motion.div>

                {/* Floating harvest badge */}
                <div
                  className="card-text-bg"
                  style={{
                    position: 'absolute', bottom: 20, right: 8,
                    padding: '12px 18px', border: '1px solid var(--bd)', boxShadow: 'var(--sh)',
                    animation: 'float-y 7s ease-in-out infinite', borderRadius: 6,
                  }}
                >
                  <p style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 3, fontWeight: 600 }}>Сьогодні зібрано</p>
                  <p style={{ fontSize: 15, color: 'var(--t0)', fontWeight: 700 }}>Полуниця · Черешня</p>
                  <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>Збір о 6:00 ранку</p>
                </div>

                {/* Green corner accent */}
                <div aria-hidden="true" style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, border: '2px solid var(--gold)', borderLeft: 'none', borderBottom: 'none', pointerEvents: 'none', borderRadius: '0 6px 0 0' }} />
                <div aria-hidden="true" style={{ position: 'absolute', bottom: -10, left: -10, width: 60, height: 60, border: '2px solid var(--gold)', borderRight: 'none', borderTop: 'none', pointerEvents: 'none', borderRadius: '0 0 0 6px' }} />
              </div>

              {/* Season badge */}
              <div
                className="card-text-bg"
                style={{
                  position: 'absolute', top: 24, right: 8,
                  padding: '14px 20px', border: '1px solid var(--bd)', boxShadow: 'var(--sh)',
                  animation: 'float-y 6s 0.8s ease-in-out infinite',
                  borderRadius: 6,
                }}
              >
                <p style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4, fontWeight: 600 }}>Зараз у сезоні</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 500, color: 'var(--t0)' }}>
                  <CategoryIcon id="berries" size={18} />
                  <span>Травень 2026</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="hidden xl:flex"
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1,
          }}
        >
          <span style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--t2)' }}>Прокрути</span>
          <div style={{ width: 1, height: 52, background: 'linear-gradient(to bottom, var(--gold), transparent)', animation: 'scroll-fade 2s ease-in-out infinite' }} />
        </div>
      </section>

      {/* ══════════════════════════════════
          MARQUEE — pure CSS, no JS
      ══════════════════════════════════ */}
      <div
        className="overflow-hidden py-4"
        style={{ borderTop: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)', background: 'var(--b2)' }}
        aria-hidden="true"
      >
        <div className="marquee-track">
          {/* Duplicate for seamless loop — 2× is enough */}
          {[0, 1].map(copy => (
            <span key={copy} style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: 3, color: 'var(--gold)', paddingRight: 0 }}>
              {words.map(w => `${w} · `).join('')}&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════
          CATEGORIES
      ══════════════════════════════════ */}
      <section className="section" aria-labelledby="cat-heading">
        <div className="page-wrap">
          <SectionTitle eyebrow="Що шукаєте" title="Оберіть" titleItalic="категорію" className="mb-12" />
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.filter(c => c.id !== 'all').map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.48, delay: i * 0.08, ease: [0.34, 1.2, 0.64, 1] }}
                className="card-lift card-corner"
              >
                <Link
                  to={`/catalog?cat=${cat.id}`}
                  className="group block relative overflow-hidden aspect-[5/4] min-[420px]:aspect-[4/3]"
                  style={{ border: '1px solid var(--bd)', textDecoration: 'none' }}
                  aria-label={`Категорія: ${cat.label_uk}`}
                >
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(180deg, var(--b0) 0%, var(--b1) 100%)',
                    transition: 'background 0.35s',
                    padding: 'clamp(10px, 3.8vw, 14px) clamp(10px, 3vw, 12px)',
                    textAlign: 'center',
                  }}>
                    {/* Icon with float-y-sm animation, staggered by index */}
                    <span
                      style={{
                        marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: `float-y-sm ${5 + i * 0.4}s ${i * 0.3}s ease-in-out infinite`,
                        filter: 'drop-shadow(0 2px 6px rgba(74,140,63,0.18))',
                      }}
                    >
                      <CategoryIcon id={cat.id as 'all' | 'berries' | 'fruits' | 'vegetables' | 'greens' | 'plants'} size={34} />
                    </span>
                    <span style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(15px, 3.9vw, 18px)', fontWeight: 300,
                      color: 'var(--t0)', letterSpacing: 1,
                      transition: 'letter-spacing 0.3s',
                    }}
                      className="group-hover:tracking-widest"
                    >
                      {cat.label_uk}
                    </span>
                    {cat.description && (
                      <span style={{
                        marginTop: 5,
                        fontSize: 'clamp(10px, 2.7vw, 11px)',
                        lineHeight: 1.35,
                        maxWidth: 190,
                        color: 'var(--t1)',
                      }}>
                        {cat.description}
                      </span>
                    )}
                    {cat.count && (
                      <span style={{ fontSize: 'clamp(9px, 2.3vw, 10px)', letterSpacing: 2, color: 'var(--t2)', marginTop: 4 }}>
                        {cat.count} позицій
                      </span>
                    )}
                  </div>
                  {/* Gold border on hover */}
                  <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--gold)', opacity: 0, transition: 'opacity 0.25s', pointerEvents: 'none' }}
                    className="group-hover:opacity-100" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          NEW ARRIVALS
      ══════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--b1)', position: 'relative', overflow: 'hidden' }} aria-labelledby="new-heading">
        <div className="absolute inset-0 orn-bg-cool" style={{ opacity: 0.28, pointerEvents: 'none' }} />
        <div className="page-wrap" style={{ position: 'relative', zIndex: 1 }}>
          <FadeIn dir="up" delay={0}>
            <div className="flex justify-between items-end mb-14">
              <SectionTitle eyebrow="Щойно зібрано" title="Свіжинки" titleItalic="сезону" />
              <Link to="/catalog?sort=newest" className="btn-ghost hidden sm:flex">
                Всі новинки <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          EDITORIAL BANNER — always dark
      ══════════════════════════════════ */}
      <section ref={editorialRef} className="section-lg" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Parallax photo background */}
        <motion.div aria-hidden="true" style={{
          y: editorialBgY,
          position: 'absolute',
          inset: '-15% 0',
          backgroundImage: 'url(https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1800&h=900&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          willChange: 'transform',
          zIndex: 0,
        }} />
        {/* Dark overlay */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,6,4,0.94) 0%, rgba(10,8,5,0.80) 55%, rgba(8,6,4,0.60) 100%)', zIndex: 1 }} />
        {/* Vignette */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(4,3,2,0.55) 100%)', zIndex: 1 }} />
        <div className="page-wrap" style={{ position: 'relative', zIndex: 2 }}>
          <div className="grid lg:grid-cols-[3fr_2fr] gap-20 items-center">
            <motion.div {...fadeUp()}>
              <div className="flex items-center gap-3 mb-6">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Як ми вирощуємо</span>
              </div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 'clamp(38px,5vw,68px)', fontWeight: 800, color: 'rgba(232,245,226,0.93)', lineHeight: 1.05, marginBottom: 24 }}>
                Від поля —<br /><span style={{ color: 'var(--gold-l)' }}>до вашого столу</span><br />без посередників
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.9, color: 'rgba(232,245,226,0.55)', marginBottom: 36, maxWidth: 500 }}>
                Ми вирощуємо без пестицидів і (до)брив на власних 12 гектарах. Кожен замовлення збирається зранку і доставляється цього ж дня — за допомогою Нова Пошта або кур'єром.
              </p>
              <Link to="/story" className="btn-gold">
                Дізнатись більше <ArrowRight size={16} />
              </Link>
            </motion.div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              <LazyImage
                src="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=380&h=480&fit=crop&q=85&fm=webp"
                alt="Полуниця з ферми Bionerica"
                aspectRatio="aspect-[4/5]"
                className="mt-10"
                sizes="20vw"
              />
              <LazyImage
                src="https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=380&h=480&fit=crop&q=85&fm=webp"
                alt="Свіжі овочі Bionerica"
                aspectRatio="aspect-[4/5]"
                sizes="20vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          BESTSELLERS
      ══════════════════════════════════ */}
      <section className="section" aria-labelledby="best-heading">
        <div className="page-wrap">
          <FadeIn dir="up" delay={0}>
            <div className="flex justify-between items-end mb-14">
              <SectionTitle eyebrow="Найпопулярніше" title="Хіти" titleItalic="продажів" />
              <Link to="/catalog?filter=bestseller" className="btn-ghost hidden sm:flex">
                Всі хіти <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
          <div className="flex flex-col gap-5">
            {bestsellers.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} view="list" />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════ */}
      <section ref={testimonialsRef} className="section-sm" style={{ overflow: 'hidden', position: 'relative' }} aria-label="Відгуки клієнтів">
        {/* Parallax background */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          <motion.div
            style={{
              position: 'absolute',
              inset: '-20%',
              y: testimonialsBgY,
              backgroundImage: 'url(https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1800&h=900&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
            }}
          />
          {/* Multi-layer dark overlay: keeps text readable + warm tone */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(10,8,6,0.78) 0%, rgba(14,11,8,0.72) 50%, rgba(10,8,6,0.82) 100%)',
            }}
          />
          {/* Subtle warm vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(8,6,4,0.55) 100%)',
            }}
          />
          {/* Top/bottom separator lines */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.25) 25%, rgba(201,169,110,0.25) 75%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.25) 25%, rgba(201,169,110,0.25) 75%, transparent 100%)' }} />
        </div>
        <div style={{
          position: 'relative', zIndex: 1, background: 'transparent',
          '--t0': 'rgba(245,240,232,0.96)',
          '--t1': 'rgba(220,210,195,0.72)',
          '--bd': 'rgba(201,169,110,0.22)',
        } as React.CSSProperties}>
          <div className="page-wrap mb-10">
            <SectionTitle eyebrow="Відгуки" title="Що кажуть клієнти" align="center" />
          </div>
          <ReviewsSlider />
        </div>
      </section>

      {/* ══════════════════════════════════
          BLOG PREVIEW
      ══════════════════════════════════ */}
      <section className="section" aria-labelledby="blog-heading">
        <div className="page-wrap">
          <div className="flex justify-between items-end mb-14">
            <SectionTitle eyebrow="Блог Bionerica" title="Корисно" titleItalic="про їжу" />
            <Link to="/blog" className="btn-ghost hidden sm:flex">
              Всі статті <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
            {homePosts[0] && (
              <Link to={`/blog/${homePosts[0].slug}`} className="group block" aria-label={homePosts[0].title}>
                <div className="overflow-hidden mb-5">
                  <LazyImage
                    src={homePosts[0].image}
                    alt={homePosts[0].title}
                    aspectRatio="aspect-[16/9]"
                    className="transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width:1024px) 60vw, 100vw"
                  />
                </div>
                <span className="label-xs mb-2 block">{homePosts[0].category}</span>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: 'var(--t0)', lineHeight: 1.2, marginBottom: 10 }}
                  className="group-hover:text-[var(--gold-d)] transition-colors">
                  {homePosts[0].title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.7, marginBottom: 8 }}>{homePosts[0].excerpt}</p>
                <span style={{ fontSize: 11, color: 'var(--t2)' }}>{homePosts[0].read_time} читання</span>
              </Link>
            )}
            <div className="flex flex-col gap-6">
              {homePosts.slice(1, 4).map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group flex gap-4">
                  <div className="flex-shrink-0 w-20">
                    <LazyImage src={post.image} alt={post.title} aspectRatio="aspect-square" className="w-20" sizes="80px" />
                  </div>
                  <div className="flex-1">
                    <span className="label-xs mb-1 block">{post.category}</span>
                    <h4 style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--t0)', lineHeight: 1.3, marginBottom: 4 }}
                      className="group-hover:text-[var(--gold-d)] transition-colors">
                      {post.title}
                    </h4>
                    <span style={{ fontSize: 11, color: 'var(--t2)' }}>{post.read_time} читання</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          NEWSLETTER
      ══════════════════════════════════ */}
      <section className="section" style={{ borderTop: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)' }}>
        <div className="page-wrap">
          <NewsletterWidget
            title="Новини прямо з поля"
            subtitle="Розклад сезонних збирань, нові продукти та ексклюзивні знижки для підписників"
            showTelegram
          />
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA
      ══════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--b1)', borderTop: '1px solid var(--bd)', position: 'relative', overflow: 'hidden' }}>
        {/* CTA pattern — change className to: cta-pattern-a / b / c / d / e */}
        <div className="absolute inset-0 cta-pattern-e" style={{ pointerEvents: 'none' }} />
        <div className="page-wrap relative z-[1]">
          <div className="w-full max-w-2xl xl:max-w-3xl">
            <span className="eyebrow">Тижнева підписка</span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, DM Sans, sans-serif', fontSize: 'clamp(34px,4.5vw,62px)', fontWeight: 800, color: 'var(--t0)', lineHeight: 1.08, marginBottom: 18 }}>
              Оформи бокс<br /><span style={{ color: 'var(--gold)' }}>свіжих ягід та овочів</span>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--t1)', marginBottom: 32 }}>
              Щотижнева або двотижнева доставка свіжих ягід, фруктів і овочів. Ми збираємо зранку і доставляємо в день збору. Оберіть, коли і скільки.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/catalog" className="btn-dark" style={{ background: 'var(--gold)', border: 'none', color: '#fff', borderRadius: 4 }}>
                Оформити підписку <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="btn-outline">
                Запитати
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
    )
  }
