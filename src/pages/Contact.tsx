import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  MapPin, Phone, Mail, Clock, Send, Check,
  Instagram, Facebook, Youtube, MessageCircle,
  ChevronDown, ArrowRight
} from 'lucide-react'
import { useSEO } from '@/hooks/useSEO'
import toast from 'react-hot-toast'
import { checkRateLimit, isHoneypotFilled } from '@/lib/formProtection'

type Form = {
  name: string; email: string; phone: string
  subject: string; message: string; budget?: string
  _honey?: string
}

const contactBlocks = [
  {
    icon: Phone,
    label: 'Телефон',
    value: '+38 (096) 123-45-67',
    sub: 'Вайбер · Telegram · WhatsApp',
    href: 'tel:+380961234567',
    accent: '#c9a96e',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@bionerica.ua',
    sub: 'Відповідаємо протягом 24 годин',
    href: 'mailto:hello@bionerica.ua',
    accent: '#8a9e8c',
  },
  {
    icon: MapPin,
    label: 'Адреса',
    value: 'м. Полтава',
    sub: 'вул. Набережна, 34 · пункт самовивозу',
    href: 'https://maps.google.com/?q=Полтава',
    accent: '#7a9ab5',
  },
  {
    icon: Clock,
    label: 'Графік роботи',
    value: 'Пн–Пт: 10–19',
    sub: 'Сб: 11–17 · Нд: вихідний',
    href: null,
    accent: '#c4847a',
  },
]

const faqs = [
  { q: 'Коли ви збираєте продукцію?', a: 'Основні ягоди, зелень та овочі збираємо рано-вранці у день відправлення або доставки, щоб зберегти свіжість.' },
  { q: 'Чи можна замовити на конкретну дату?', a: 'Так. Для сезонних продуктів ви можете обрати бажану дату доставки під час оформлення замовлення.' },
  { q: 'Чи працюєте з кав\'ярнями та ресторанами?', a: 'Так, ми формуємо регулярні поставки для HoReCa, невеликих магазинів та корпоративних клієнтів.' },
  { q: 'Як ви гарантуєте якість?', a: 'Ми сортуємо продукцію вручну, охолоджуємо її після збору та відправляємо в захисному пакуванні того ж дня.' },
  { q: 'Чи можна замовити розсаду?', a: 'Так, у сезон доступна розсада томатів, перцю, полуниці та ароматних трав для дому й теплиць.' },
]

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>()

  useSEO({
    title: 'Контакти — Написати нам',
    description: 'Зв\'яжіться з Bionerica: замовлення, гуртові поставки, доставка, самовивіз у Полтаві та консультації щодо сезонної продукції.',
    keywords: 'Bionerica контакти, ферма Полтава, замовити ягоди, гуртові поставки овочів',
    url: '/contact',
  })

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const onSubmit = async (d: Form) => {
    // Honeypot check — bots fill hidden fields
    if (isHoneypotFilled(d._honey ?? '')) return

    // Rate limit: max 5 submissions per minute
    if (!checkRateLimit('contact')) {
      toast.error('Надто багато спроб. Зачекайте хвилину.', { className: 'hot-toast' })
      return
    }

    await new Promise(r => setTimeout(r, 800)) // simulate request
    setSent(true); reset()
    toast.success('Повідомлення надіслано!', { className: 'hot-toast' })
    setTimeout(() => setSent(false), 8000)
  }

  return (
    <>
      {/* ── JSON-LD structured data ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Bionerica — органічна ферма',
        description: 'Свіжі ягоди, фрукти, овочі, зелень та розсада з прямою доставкою з ферми.',
        url: 'https://bionerica.ua',
        telephone: '+380961234567',
        email: 'hello@bionerica.ua',
        address: { '@type': 'PostalAddress', streetAddress: 'вул. Набережна, 34', addressLocality: 'Полтава', addressCountry: 'UA' },
        openingHours: ['Mo-Fr 10:00-19:00', 'Sa 11:00-17:00'],
        sameAs: ['https://instagram.com/bionerica_ua', 'https://facebook.com/bionerica'],
        priceRange: '₴₴₴',
        image: 'https://bionerica.ua/og-image.jpg',
      })}} />

      <div style={{ background: 'var(--b0)' }}>

        {/* ══════════════════════════════
            HERO HEADER — dark, stand-out
        ══════════════════════════════ */}
        <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '72vh', display: 'flex', alignItems: 'center' }}>
          <motion.div style={{ y: bgY, position: 'absolute', inset: '-20% 0', backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&h=900&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,6,0.80) 0%, rgba(14,11,8,0.72) 50%, rgba(10,8,6,0.82) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(8,6,4,0.5) 100%)' }} />
          <motion.div style={{ y: contentY, opacity: heroOpacity, position: 'relative', zIndex: 1, width: '100%' }}>
            <div className="page-wrap py-20">
              <div className="flex items-center gap-3 mb-6">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Зв'яжіться з нами</span>
              </div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(44px,6vw,80px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1.05, marginBottom: 20 }}>
                Ми раді почути<br /><em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>кожного з вас</em>
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(245,240,232,0.5)', maxWidth: 520 }}>
                Питання про замовлення, дати збору, гуртові поставки або самовивіз у Полтаві — пишіть, телефонуйте або приїжджайте.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ══════════════════════════════
            CONTACT BLOCKS — 4 cards
        ══════════════════════════════ */}
        <div style={{ background: 'var(--b1)', borderBottom: '1px solid var(--bd)' }}>
          <div className="page-wrap py-0">
            <div className="grid grid-cols-2 lg:grid-cols-4" style={{ marginTop: -1 }}>
              {contactBlocks.map((block, i) => {
                const Icon = block.icon
                const inner = (
                  <div
                    key={block.label}
                    className="flex flex-col gap-3 p-7 transition-all group"
                    style={{
                      borderRight: i < 3 ? '1px solid var(--bd)' : 'none',
                      borderBottom: '3px solid transparent',
                      cursor: block.href ? 'none' : 'default',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'var(--b0)'
                      el.style.borderBottomColor = block.accent
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'transparent'
                      el.style.borderBottomColor = 'transparent'
                    }}
                  >
                    {/* Icon circle */}
                    <div style={{
                      width: 44, height: 44,
                      background: block.accent + '18',
                      border: `1px solid ${block.accent}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={18} style={{ color: block.accent }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: block.accent, marginBottom: 5 }}>
                        {block.label}
                      </p>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, fontWeight: 300, color: 'var(--t0)', marginBottom: 3 }}>
                        {block.value}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
                        {block.sub}
                      </p>
                    </div>
                  </div>
                )

                return block.href ? (
                  <a key={block.label} href={block.href} target={block.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    {inner}
                  </a>
                ) : inner
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            MAIN CONTENT: form + sidebar
        ══════════════════════════════ */}
        <div className="page-wrap py-20">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-16 items-start">

            {/* ── FORM ── */}
            <div>
              {/* Form header */}
              <div className="flex items-center gap-3 mb-3">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Форма зв'язку</span>
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 300, color: 'var(--t0)', marginBottom: 8, borderBottom: '1px solid var(--bd)', paddingBottom: 16 }}>
                Написати нам
              </h2>
              <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.7, marginBottom: 36, marginTop: 16 }}>
                Заповніть форму і ми відповімо протягом 24 годин. Або напишіть напряму на{' '}
                <a href="mailto:hello@bionerica.ua" style={{ color: 'var(--gold-d)', textDecoration: 'underline' }}>
                  hello@bionerica.ua
                </a>
              </p>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="p-10 flex flex-col items-center text-center"
                    style={{ background: 'var(--b1)', border: '1px solid var(--bd)', borderTop: '3px solid var(--sage)' }}
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <Check size={28} color="white" strokeWidth={2.5} />
                    </motion.div>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: 'var(--t0)', marginBottom: 12 }}>
                      Дякуємо!
                    </h3>
                    <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.8, maxWidth: 380 }}>
                      Ваше повідомлення надіслано. Ми відповімо протягом 24 годин на вашу електронну адресу.
                    </p>
                    <button onClick={() => setSent(false)} className="btn-ghost mt-6" style={{ fontSize: 11, letterSpacing: 2 }}>
                      Надіслати ще одне →
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
                  >
                    {/* Honeypot — hidden from real users, bots fill it */}
                    <div style={{ position: 'absolute', left: '-9999px', top: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                      <input tabIndex={-1} autoComplete="off" {...register('_honey')} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Name */}
                      <div>
                        <label style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>
                          Ваше ім'я *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="field-input-box"
                            placeholder="Оксана Коваленко"
                            autoComplete="given-name"
                            {...register('name', { required: "Вкажіть ім'я" })}
                            style={{ borderColor: errors.name ? 'var(--rose)' : undefined }}
                          />
                          {errors.name && <p style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>{errors.name.message}</p>}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>
                          Email *
                        </label>
                        <input
                          type="email"
                          className="field-input-box"
                          placeholder="your@email.com"
                          autoComplete="email"
                          {...register('email', {
                            required: 'Вкажіть email',
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Невірний формат' }
                          })}
                          style={{ borderColor: errors.email ? 'var(--rose)' : undefined }}
                        />
                        {errors.email && <p style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>{errors.email.message}</p>}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Phone */}
                      <div>
                        <label style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>
                          Телефон
                        </label>
                        <input type="tel" className="field-input-box" placeholder="+38 (0XX) XXX-XX-XX"
                          autoComplete="tel" {...register('phone')} />
                      </div>

                      {/* Subject */}
                      <div>
                        <label style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>
                          Тема звернення
                        </label>
                        <select className="field-input-box" {...register('subject')}
                          style={{ background: 'var(--b1)', color: 'var(--t0)' }}>
                          <option value="order">Замовлення товару</option>
                          <option value="custom">Індивідуальне пошиття</option>
                          <option value="wholesale">Гуртовий продаж</option>
                          <option value="masterclass">Майстер-клас</option>
                          <option value="media">Медіа / Пресa</option>
                          <option value="other">Інше</option>
                        </select>
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <label style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>
                        Орієнтовний бюджет
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['до 2 000 ₴', '2 000–5 000 ₴', '5 000–10 000 ₴', '10 000+ ₴', 'Не визначився'].map(b => (
                          <label key={b} className="budget-pill" style={{ position: 'relative', cursor: 'none' }}>
                            <input
                              type="radio"
                              value={b}
                              {...register('budget')}
                              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                            />
                            <span className="pill" style={{ cursor: 'none', display: 'inline-block', transition: 'all .2s' }}>
                              {b}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>
                        Повідомлення *
                      </label>
                      <textarea
                        rows={6}
                        className="field-input-box"
                        style={{ resize: 'none', borderColor: errors.message ? 'var(--rose)' : undefined }}
                        placeholder="Розкажіть про ваш запит — виріб, розмір, орнамент, дату потрібності..."
                        {...register('message', { required: 'Напишіть повідомлення', minLength: { value: 10, message: 'Мінімум 10 символів' } })}
                      />
                      {errors.message && <p style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>{errors.message.message}</p>}
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-6 flex-wrap">
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileTap={{ scale: 0.97 }}
                        className="btn-dark flex items-center gap-3"
                        style={{ opacity: isSubmitting ? 0.7 : 1 }}
                      >
                        {isSubmitting ? (
                          <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Надсилається...</>
                        ) : (
                          <><Send size={15} /> Надіслати повідомлення</>
                        )}
                      </motion.button>
                      <p style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5, maxWidth: 240 }}>
                        Натискаючи «Надіслати», ви погоджуєтесь з нашою{' '}
                        <a href="/privacy" style={{ color: 'var(--gold-d)' }}>політикою конфіденційності</a>
                      </p>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* ── SIDEBAR ── */}
            <div className="flex flex-col gap-6">

              {/* Quick contact card */}
              <div style={{ background: '#1a1612', padding: 28, position: 'relative', overflow: 'hidden' }}>
                <div className="absolute inset-0 orn-bg opacity-[0.07] pointer-events-none" />
                <div className="relative z-[1]">
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
                    Швидкий зв'язок
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'rgba(245,240,232,0.93)', marginBottom: 20, lineHeight: 1.3 }}>
                    Хочете відповідь<br />прямо зараз?
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      { Icon: MessageCircle, label: 'Telegram', href: 'https://t.me/bionerica_ua', color: '#54a9eb' },
                      { Icon: Phone,         label: 'Viber',    href: 'viber://chat?number=380961234567', color: '#7360f2' },
                      { Icon: Instagram,     label: 'Instagram DM', href: 'https://instagram.com/bionerica_ua', color: '#e4405f' },
                    ].map(s => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 py-3 px-4 transition-all group"
                        style={{ border: '1px solid rgba(201,169,110,0.22)', color: 'rgba(245,240,232,0.7)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color; (e.currentTarget as HTMLElement).style.color = 'white' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.2)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}
                      >
                        <s.Icon size={16} style={{ color: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13 }}>{s.label}</span>
                        <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visit card */}
              <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', borderLeft: '3px solid var(--gold)', padding: 24 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Відвідати ферму</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 8 }}>
                  Полтава, вул. Набережна 34
                </p>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 16 }}>
                  Пн–Пт: 10:00–19:00<br />Субота: 11:00–17:00<br />Неділя: вихідний
                </p>
                <a href="https://maps.google.com/?q=Полтава+вул+Набережна+34"
                  target="_blank" rel="noopener noreferrer"
                  className="btn-ghost text-[11px]" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} /> Відкрити в Maps →
                </a>
              </div>

              {/* Social proof card */}
              <div style={{ background: 'var(--b1)', border: '1px solid var(--bd)', padding: 24 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Ми у соцмережах</p>
                <div className="flex flex-col gap-3">
                  {[
                    { Icon: Instagram, handle: '@bionerica_ua', href: 'https://instagram.com/bionerica_ua', sub: 'Сезонні новинки та збір' },
                    { Icon: Facebook,  handle: 'Bionerica UA',  href: 'https://facebook.com/bionerica',   sub: 'Оновлення каталогу та акції' },
                    { Icon: Youtube,   handle: 'Bionerica',     href: 'https://youtube.com/@bionerica',  sub: 'Ферма, догляд і сезонні поради' },
                  ].map(s => (
                    <a key={s.handle} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 transition-colors group"
                      style={{ color: 'var(--t1)', textDecoration: 'none' }}>
                      <s.Icon size={16} style={{ color: 'var(--t2)', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, color: 'var(--t0)' }} className="group-hover:text-[var(--gold-d)] transition-colors">{s.handle}</p>
                        <p style={{ fontSize: 11, color: 'var(--t2)' }}>{s.sub}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            MAP + ADDRESS SIDE BY SIDE
        ══════════════════════════════ */}
        <div style={{ borderTop: '1px solid var(--bd)' }}>
          <div className="grid lg:grid-cols-[2fr_1fr]">
            {/* Map */}
            <div style={{ position: 'relative', minHeight: 400 }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d42096.98!2d34.54!3d49.59!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d8e3d3f93c5f33%3A0x17a09d428c1cb5b6!2sPolтава%2C+Poltava+Oblast!5e0!3m2!1suk!2sua"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block', minHeight: 400, filter: 'saturate(0.7) sepia(0.15)' }}
                allowFullScreen
                loading="lazy"
                title="Bionerica на карті Полтави"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Info panel beside map */}
            <div style={{ background: '#1a1612', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div className="absolute inset-0 orn-bg opacity-[0.06] pointer-events-none" />
              <div className="relative z-[1]">
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>Як нас знайти</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1.2, marginBottom: 24 }}>
                  Bionerica
                </p>
                {[
                  { icon: MapPin, text: 'м. Полтава, вул. Набережна 34\nПункт самовивозу та консультацій' },
                  { icon: Clock,  text: 'Пн–Пт: 10:00–19:00\nСб: 11:00–17:00' },
                  { icon: Phone,  text: '+38 (096) 123-45-67' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 mb-5">
                    <item.icon size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 3 }} />
                    <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.55)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {item.text}
                    </p>
                  </div>
                ))}
                <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(201,169,110,0.18)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.3)', lineHeight: 1.6 }}>
                    🚇 10 хв від центру · Є паркінг · Зупинка «Соборності»
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            FAQ
        ══════════════════════════════ */}
        <div className="section" style={{ background: 'var(--b1)' }}>
          <div className="page-wrap">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                  <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>FAQ</span>
                </div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 300, color: 'var(--t0)', lineHeight: 1.1, paddingBottom: 16, borderBottom: '1px solid var(--bd)' }}>
                  Часті<br /><em style={{ color: 'var(--gold-d)', fontStyle: 'italic' }}>питання</em>
                </h2>
                <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, marginTop: 16 }}>
                  Не знайшли відповідь? Напишіть нам — відповімо протягом доби.
                </p>
              </div>

              <div className="flex flex-col" style={{ gap: 0 }}>
                {faqs.map((faq, i) => (
                  <motion.div
                    key={i}
                    style={{ borderBottom: '1px solid var(--bd)' }}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between py-5 text-left transition-all"
                      style={{ background: 'none', border: 'none' }}
                    >
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(17px,2vw,21px)', fontWeight: 300, color: 'var(--t0)', lineHeight: 1.3, paddingRight: 20 }}>
                        {faq.q}
                      </span>
                      <motion.span
                        animate={{ rotate: openFaq === i ? 180 : 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ flexShrink: 0 }}
                      >
                        <ChevronDown size={18} style={{ color: 'var(--gold)' }} />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.85, paddingBottom: 20 }}>
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Spin animation for submit button */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
