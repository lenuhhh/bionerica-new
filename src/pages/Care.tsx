// Care.tsx - Догляд за вишивкою
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useSEO } from '@/hooks/useSEO'
import LazyImage from '@/components/ui/LazyImage'

const careGuide = [
  {
    icon: '🌊',
    title: 'Прання',
    rules: [
      { good: true,  text: 'Ручне прання при 30°C з м\'яким засобом' },
      { good: true,  text: 'Делікатний режим у сітці для прання' },
      { good: false, text: 'Температура вище 40°C руйнує волокна' },
      { good: false, text: 'Відбілювачі — пошкоджують колір ниток' },
      { good: false, text: 'Жорстке кручення при вичавці' },
    ],
  },
  {
    icon: '☀️',
    title: 'Сушка',
    rules: [
      { good: true,  text: 'Сушити у розпрямленому стані в тіні' },
      { good: true,  text: 'Горизонтальна поверхня зберігає форму' },
      { good: false, text: 'Прямі сонячні промені вибілюють нитки' },
      { good: false, text: 'Барабанна сушка деформує вишивку' },
    ],
  },
  {
    icon: '🔥',
    title: 'Прасування',
    rules: [
      { good: true,  text: 'З виворітного боку через вологу тканину' },
      { good: true,  text: 'Середня температура (режим «бавовна»)' },
      { good: false, text: 'Пряма праска на вишивці — сплющує стіби' },
      { good: false, text: 'Пара на золотих та металізованих нитках' },
    ],
  },
  {
    icon: '📦',
    title: 'Зберігання',
    rules: [
      { good: true,  text: 'Зберігати складеним або на широкій вішалці' },
      { good: true,  text: 'Тканина з натуральних волокон без синтетики' },
      { good: true,  text: 'Прохолодне, сухе, темне місце' },
      { good: false, text: 'Поліетиленові пакети — накопичують вологу' },
      { good: false, text: 'Нафталін — пошкоджує природні волокна' },
    ],
  },
]

export default function Care() {
  useSEO({
    title: 'Догляд за вишивкою',
    description: 'Як доглядати за вишиванкою, рушником та вишитою сукнею. Правила прання, сушки, прасування та зберігання від майстринь Broiderie.',
    url: '/care',
  })

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <div style={{ background: 'var(--b0)' }}>
      <div ref={heroRef} style={{ position: 'relative', overflow: 'hidden', minHeight: '72vh', display: 'flex', alignItems: 'center' }}>
        <motion.div style={{ y: bgY, position: 'absolute', inset: '-20% 0', backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&h=900&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', willChange: 'transform' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,6,0.80) 0%, rgba(14,11,8,0.72) 50%, rgba(10,8,6,0.82) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(8,6,4,0.5) 100%)' }} />
        <motion.div style={{ y: contentY, opacity: heroOpacity, position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="page-wrap py-20">
            <div className="flex items-center gap-3 mb-4">
              <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
              <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Майстерність</span>
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', marginBottom: 16 }}>
              Догляд за <em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>вишивкою</em>
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(245,240,232,0.5)', maxWidth: 500, lineHeight: 1.7 }}>
              Правильний догляд подовжить життя вашого виробу на десятки років і збереже яскравість кольорів.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="page-wrap section">
        {/* Main guide */}
        <div className="grid sm:grid-cols-2 gap-8 mb-20">
          {careGuide.map(section => (
            <div key={section.title} style={{ padding: 32, border: '1px solid var(--bd)', background: 'var(--b1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--bd)' }}>
                <span style={{ fontSize: 28 }}>{section.icon}</span>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--t0)' }}>
                  {section.title}
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.rules.map((rule, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11,
                      background: rule.good ? 'rgba(138,158,140,0.2)' : 'rgba(196,132,122,0.2)',
                      color: rule.good ? 'var(--sage)' : 'var(--rose)',
                      marginTop: 1,
                    }}>
                      {rule.good ? '✓' : '✗'}
                    </span>
                    <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.6 }}>{rule.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Special materials */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ width: 20, height: 1, background: 'var(--gold)', display: 'block' }} />
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--t0)' }}>
              Спеціальний догляд по матеріалах
            </h2>
          </div>
          <div style={{ height: 1, background: 'var(--bd)', marginBottom: 28 }} />
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                material: '🌿 Льон',
                tips: ['Прання при 40°C у делікатному режимі', 'Злегка вологий при прасуванні', 'З часом стає м\'якшим і красивішим'],
              },
              {
                material: '🦋 Шовк',
                tips: ['Лише ручне прання або хімчистка', 'Спеціальний засіб для шовку', 'Не викручувати — промокнути рушником'],
              },
              {
                material: '✨ Золота нитка',
                tips: ['Ніколи не використовувати пару', 'М\'яка щіточка для полірування', 'Зберігати окремо від агресивних матеріалів'],
              },
            ].map(m => (
              <div key={m.material} style={{ padding: 24, border: '1px solid var(--bd)', background: 'var(--b1)' }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: 'var(--t0)', marginBottom: 16 }}>
                  {m.material}
                </h3>
                {m.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--gold)', fontSize: 14, flexShrink: 0, marginTop: 1 }}>✦</span>
                    <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
