// Blog.tsx
import { useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { usePosts } from '@/hooks/useProducts'
import LazyImage from '@/components/ui/LazyImage'
import { SectionTitle, Breadcrumb } from '@/components/ui'
import { useSEO } from '@/hooks/useSEO'

export default function Blog() {
  const { posts: blogPosts, loading } = usePosts()
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = useMemo(() => {
    const base = ['all', 'Головне', 'Новини']
    const dynamic = Array.from(new Set(blogPosts.map(post => post.category).filter(Boolean)))
    return [...base, ...dynamic.filter(category => !base.includes(category))]
  }, [blogPosts])

  const featuredPosts = useMemo(() => {
    if (activeCategory === 'all') return blogPosts
    if (activeCategory === 'Головне') return blogPosts.slice(0, 6)
    if (activeCategory === 'Новини') return [...blogPosts].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    return blogPosts.filter(post => post.category === activeCategory)
  }, [activeCategory, blogPosts])

  useSEO({
    title: 'Журнал Bionerica — Органічна ферма, поради, рецепти',
    description: 'Блог про органічне вирощування, сезонні продукти, рецепти та поради з давання. Дізнайтесь як вибирати та зберігати овочі та ягоди.',
    keywords: 'органічна ферма, поради з вирощування, рецепти овощей, сезонні ягоди, органіка Україна',
    url: '/blog',
  })

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <div style={{ background: 'var(--b0)' }}>
      {/* Parallax Hero */}
      <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '72vh', display: 'flex', alignItems: 'center' }}>
        <motion.div style={{ y: bgY, position: 'absolute', inset: '-20% 0', backgroundImage: 'url(https://images.unsplash.com/photo-1542838132-92c53300491e?w=1800&h=900&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,6,0.80) 0%, rgba(14,11,8,0.72) 50%, rgba(10,8,6,0.82) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(8,6,4,0.5) 100%)' }} />
        <motion.div style={{ y: contentY, opacity: heroOpacity, position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="page-wrap py-20">
            <div className="flex items-center gap-3 mb-5">
              <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
              <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Журнал Bionerica</span>
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(44px,6vw,80px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1.05, marginBottom: 20 }}>
              Органіка, рецепти<br /><em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>та поради</em>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(245,240,232,0.5)', maxWidth: 520 }}>
              Статті про сезонні продукти, технологію органічного вирощування, кулінарні рецепти та практичні поради з догляду за овощами та ягодами.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="page-wrap section">
        {loading && <p style={{ color: 'var(--t2)', fontSize: 13, marginBottom: 20 }}>Завантаження публікацій...</p>}
        <div className="flex gap-3 flex-wrap" style={{ marginBottom: 32 }}>
          {categories.map((category) => {
            const isActive = activeCategory === category
            const label = category === 'all' ? 'Усе' : category
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                style={{
                  padding: '9px 16px',
                  border: '1px solid var(--bd)',
                  background: isActive ? 'var(--t0)' : 'transparent',
                  color: isActive ? 'var(--t-inv)' : 'var(--t1)',
                  fontSize: 12,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  transition: 'all .2s ease',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuredPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link to={`/blog/${post.slug}`} className="group block">
                <div className="overflow-hidden mb-5">
                  <LazyImage src={post.image} alt={post.title} aspectRatio="aspect-[16/10]"
                    className="transition-transform duration-700 group-hover:scale-[1.05]" />
                </div>
                <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>{post.category}</span>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 300, color: 'var(--t0)', lineHeight: 1.2, marginBottom: 10 }}
                  className="group-hover:text-[var(--gold-d)] transition-colors">{post.title}</h2>
                {post.subtitle && <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 10 }}>{post.subtitle}</p>}
                <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.7, marginBottom: 12 }}>{post.excerpt}</p>
                <div className="flex items-center gap-3" style={{ fontSize: 11, color: 'var(--t2)' }}>
                  <span>{post.author}</span>
                  <span style={{ color: 'var(--bd)' }}>·</span>
                  <span>{post.read_time} читання</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {!loading && featuredPosts.length === 0 && (
          <p style={{ color: 'var(--t2)', fontSize: 14, marginTop: 18 }}>У цій рубриці ще немає публікацій.</p>
        )}
      </div>
    </div>
  )
}
