// BlogPost.tsx
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Clock, User, Tag } from 'lucide-react'
import { usePost, usePosts } from '@/hooks/useProducts'
import LazyImage from '@/components/ui/LazyImage'
import SocialShare from '@/components/ui/SocialShare'
import { useSEO, articleSchema } from '@/hooks/useSEO'
import { useReadingProgress } from '@/hooks/useReadingProgress'

type ContentBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'note'; text: string }
  | { type: 'image'; src: string }
  | { type: 'divider' }

const parseArticleBlocks = (content: string): ContentBlock[] => {
  const chunks = content
    .replace(/\r/g, '')
    .split(/\n\n+/)
    .map(s => s.trim())
    .filter(Boolean)

  return chunks.map((chunk) => {
    if (chunk === '---') return { type: 'divider' }
    if (chunk.startsWith('## ')) return { type: 'h2', text: chunk.slice(3).trim() }
    if (chunk.startsWith('### ')) return { type: 'h3', text: chunk.slice(4).trim() }
    if (chunk.startsWith('> ')) return { type: 'quote', text: chunk.replace(/^>\s?/gm, '').trim() }
    if (chunk.startsWith('[image]')) {
      const src = chunk.replace('[image]', '').trim()
      return { type: 'image', src }
    }
    if (chunk.startsWith(':::note')) {
      return { type: 'note', text: chunk.replace(':::note', '').replace(':::', '').trim() }
    }

    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean)
    const isBulletList = lines.length > 1 && lines.every(l => /^[-*]\s+/.test(l) || /^\d+[.)]\s+/.test(l))
    if (isBulletList) {
      return { type: 'ul', items: lines.map(l => l.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '').trim()) }
    }

    return { type: 'p', text: chunk }
  })
}

export default function BlogPost() {
  const { slug } = useParams()
  const { post, loading } = usePost(slug || '')
  const { posts: listPosts } = usePosts()
  const others = listPosts.filter(p => p.slug !== slug).slice(0, 3)
  const progress = useReadingProgress()

  useSEO({
    title: post?.title || 'Журнал Broiderie',
    description: post?.excerpt || 'Статті Broiderie про вишивку, догляд, символи та новини бренду.',
    keywords: post?.tags?.join(', ') || 'вишивка, журнал, broiderie',
    image: post?.image,
    url: post ? `/blog/${post.slug}` : '/blog',
    type: post ? 'article' : 'website',
    schema: post ? articleSchema(post) : undefined,
  })

  if (loading) {
    return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}>Завантаження публікації...</div>
  }
  if (!post) return <Navigate to="/blog" />

  const fallbackContent = post.content?.trim()
    ? post.content
    : [
        post.subtitle ? `## Головне\n\n${post.subtitle}` : '',
        `## Про матеріал\n\n${post.excerpt}`,
        post.tags?.length ? `## Ключові теми\n\n${post.tags.map(tag => `- ${tag}`).join('\n')}` : '',
      ].filter(Boolean).join('\n\n')

  const contentBlocks = parseArticleBlocks(fallbackContent)

  return (
    <article>
      {/* Reading progress bar — fixed top, gold fill */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0, left: 0,
          height: 2,
          width: `${progress}%`,
          background: 'var(--gold)',
          zIndex: 999,
          transition: 'width 0.1s linear',
          transformOrigin: 'left',
        }}
      />
      {/* Hero */}
      <div style={{ position: 'relative', height: '62vh', overflow: 'hidden', background: '#1a1612' }}>
        <LazyImage src={post.image} alt={post.title} aspectRatio="aspect-auto" className="w-full h-full" priority />
        {/* Strong gradient for text readability */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(20,17,13,0.95) 0%, rgba(20,17,13,0.6) 50%, rgba(20,17,13,0.2) 100%)' }} />
        <div className="absolute inset-0 flex flex-col justify-end pb-14">
          <div className="page-wrap">
            <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 12 }}>{post.category}</span>
            <h1 className="text-on-img" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,5vw,68px)', fontWeight: 300, color: 'white', lineHeight: 1.08, maxWidth: 800 }}>
              {post.title}
            </h1>
            {post.subtitle && <p style={{ fontSize: 16, color: 'rgba(245,240,232,0.7)', marginTop: 14 }}>{post.subtitle}</p>}
          </div>
        </div>
      </div>

      <div className="page-wrap py-12 pb-24">
        <div className="grid lg:grid-cols-[1fr_300px] gap-16 items-start">
          <div>
            {/* Meta */}
            <div className="flex items-center gap-6 mb-10 pb-6" style={{ borderBottom: '1px solid var(--bd)', fontSize: 12, color: 'var(--t2)' }}>
              <Link to="/blog" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors">
                <ArrowLeft size={14} /> До блогу
              </Link>
              <div className="flex items-center gap-2"><User size={13} />{post.author}</div>
              <div className="flex items-center gap-2"><Clock size={13} />{post.read_time} читання</div>
            </div>

            {/* Content */}
            <div style={{ fontSize: 16, lineHeight: 2, color: 'var(--t1)' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic', color: 'var(--t0)', marginBottom: 24, lineHeight: 1.5 }}>
                {post.excerpt}
              </p>
              {contentBlocks.map((block, i) => {
                if (block.type === 'h2') {
                  return (
                    <h2 key={i} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: 'var(--t0)', margin: '40px 0 20px' }}>
                      {block.text}
                    </h2>
                  )
                }
                if (block.type === 'h3') {
                  return (
                    <h3 key={i} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: 'var(--t0)', margin: '28px 0 14px' }}>
                      {block.text}
                    </h3>
                  )
                }
                if (block.type === 'quote') {
                  return (
                    <blockquote key={i} style={{ borderLeft: '2px solid var(--gold)', paddingLeft: 16, margin: '20px 0', color: 'var(--t0)', fontFamily: 'Cormorant Garamond, serif', fontSize: 24, lineHeight: 1.5 }}>
                      {block.text}
                    </blockquote>
                  )
                }
                if (block.type === 'note') {
                  return (
                    <div key={i} style={{ border: '1px solid var(--bd)', background: 'var(--b1)', padding: '12px 14px', margin: '20px 0' }}>
                      <p style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Нотатка</p>
                      <p style={{ margin: 0 }}>{block.text}</p>
                    </div>
                  )
                }
                if (block.type === 'image') {
                  return (
                    <div key={i} style={{ margin: '24px 0' }}>
                      <LazyImage src={block.src} alt="Блок ілюстрації" aspectRatio="aspect-[16/10]" />
                    </div>
                  )
                }
                if (block.type === 'ul') {
                  return (
                    <ul key={i} style={{ margin: '12px 0 20px 18px', padding: 0 }}>
                      {block.items.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: 6 }}>{item}</li>
                      ))}
                    </ul>
                  )
                }
                if (block.type === 'divider') {
                  return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--bd)', margin: '28px 0' }} />
                }
                return <p key={i} style={{ marginBottom: 20 }}>{block.text}</p>
              })}
            </div>

            {/* Gallery */}
            {post.gallery && post.gallery.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 my-10">
                {post.gallery.map((img, i) => (
                  <LazyImage key={i} src={img} alt="" aspectRatio="aspect-[4/3]" />
                ))}
              </div>
            )}

            {/* Tags + Share */}
            <div className="flex flex-wrap gap-2 mt-10 pt-8" style={{ borderTop: '1px solid var(--bd)', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} style={{ padding: '6px 14px', border: '1px solid var(--bd)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--t2)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <SocialShare
                title={post.title}
                description={post.excerpt}
                image={post.image}
                url={`https://broiderie.ua/blog/${post.slug}`}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="sticky top-24">
            <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 16 }}>Автор</h3>
              <div className="flex items-center gap-3 mb-3">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--b-inv)', fontFamily: 'Cormorant Garamond, serif', fontSize: 18 }}>
                  {post.author.slice(0, 2)}
                </div>
                <div>
                  <p style={{ fontSize: 14, color: 'var(--t0)' }}>{post.author}</p>
                  <p style={{ fontSize: 11, color: 'var(--t2)' }}>Broiderie · Майстриня</p>
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid var(--bd)', padding: 24 }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 16 }}>Інші статті</h3>
              {others.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="flex gap-3 mb-4 group">
                  <div className="w-16 flex-shrink-0">
                    <LazyImage src={p.image} alt={p.title} aspectRatio="aspect-square" className="w-16" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--t0)', lineHeight: 1.4 }} className="group-hover:text-[var(--gold-d)] transition-colors">{p.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 3 }}>{p.read_time} читання</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
