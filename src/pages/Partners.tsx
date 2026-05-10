// Partners.tsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Store, Globe, Gift, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useSEO } from '@/hooks/useSEO'
import LazyImage from '@/components/ui/LazyImage'
import toast from 'react-hot-toast'
import { submitPartnerApplication } from '@/lib/supabase'

type PartnerForm = {
  company: string; contact: string; email: string; phone: string
  type: string; volume: string; message: string
}

const partnerTypes = [
  { icon: Store,  title: 'Магазини',       desc: 'Бутіки, крамниці сувенірів, маркети — розширте асортимент автентичними українськими виробами' },
  { icon: Globe,  title: 'Онлайн-ритейл',  desc: 'Маркетплейси, інтернет-магазини — додайте преміальну категорію вишивки' },
  { icon: Gift,   title: 'Корпоративні',   desc: 'Брендовані подарунки для співробітників, клієнтів та партнерів — з вашим логотипом або орнаментом' },
  { icon: Users,  title: 'Дизайнери',      desc: 'Колаборації з дизайнерами одягу — використовуйте нашу вишивку у своїх колекціях' },
]

const wholesaleTerms = [
  ['Мінімальне замовлення', 'від 5 виробів'],
  ['Знижка',                'до 25% від роздрібної ціни'],
  ['Відстрочка платежу',    'до 30 днів для постійних партнерів'],
  ['Доставка',              'безкоштовна від 10 000₴'],
  ['Маркування',            'ваш бренд + Broiderie або лише ваш'],
  ['Ексклюзивність',        'ексклюзив регіону для великих партнерів'],
]

export default function Partners() {
  useSEO({
    title: 'Партнерам та Оптовикам',
    description: 'Оптові поставки вишитих виробів для магазинів, маркетплейсів та корпоративних клієнтів. Знижки до 25%, відстрочка платежу, брендування.',
    keywords: 'оптова вишивка, вишиванки оптом, корпоративні подарунки вишивка, Broiderie партнер',
    url: '/partners',
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PartnerForm>()
  const onSubmit = async (d: PartnerForm) => {
    await submitPartnerApplication({
      company: d.company, contact: d.contact, email: d.email,
      phone: d.phone, type: d.type, volume: d.volume, message: d.message,
    })
    toast.success('Заявку отримано! Зв\'яжемось протягом 24 годин.', { className: 'hot-toast' })
    reset()
  }

  return (
    <div style={{ background: 'var(--b0)' }}>
      {/* Hero */}
      <div className="dark-section" style={{ position: 'relative', overflow: 'hidden', minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="absolute inset-0 orn-bg" style={{ opacity: 0.06 }} />
        <div className="page-wrap py-20 relative z-[1]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Для бізнесу</span>
              </div>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(44px,6vw,76px)', fontWeight: 300, color: 'rgba(245,240,232,0.93)', lineHeight: 1.05, marginBottom: 20 }}>
                Партнерам<br />&<br /><em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}>Оптовикам</em>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(245,240,232,0.5)', lineHeight: 1.8, marginBottom: 36, maxWidth: 440 }}>
                Постачаємо автентичну українську вишивку магазинам, бутікам, маркетплейсам та корпоративним клієнтам по всьому світу.
              </p>
              <div className="flex gap-4 flex-wrap">
                <a href="#partner-form" className="btn-gold">Стати партнером <ArrowRight size={16} /></a>
                <a href="mailto:partners@broiderie.ua" style={{ color: 'rgba(245,240,232,0.6)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  partners@broiderie.ua →
                </a>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop',
                'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=500&fit=crop',
              ].map((src, i) => (
                <LazyImage key={i} src={src} alt="" aspectRatio="aspect-[4/5]" className={i === 1 ? 'mt-10' : ''} sizes="20vw" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Partner types */}
      <section className="section">
        <div className="page-wrap">
          <div className="flex items-center gap-3 mb-3">
            <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
            <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Хто ми обслуговуємо</span>
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(30px,4vw,48px)', fontWeight: 300, color: 'var(--t0)', paddingBottom: 14, borderBottom: '1px solid var(--bd)', marginBottom: 40 }}>
            Типи партнерства
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerTypes.map((p, i) => (
              <motion.div key={p.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ padding: 28, border: '1px solid var(--bd)', background: 'var(--b1)' }}
              >
                <p.icon size={24} style={{ color: 'var(--gold)', marginBottom: 16 }} />
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: 'var(--t0)', marginBottom: 10 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wholesale terms */}
      <section className="section-sm" style={{ background: 'var(--b1)' }}>
        <div className="page-wrap">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Умови співпраці</span>
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 300, color: 'var(--t0)', paddingBottom: 14, borderBottom: '1px solid var(--bd)', marginBottom: 28 }}>
                Що ми пропонуємо
              </h2>
              {wholesaleTerms.map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid var(--bd)', fontSize: 14 }}>
                  <span style={{ color: 'var(--t2)' }}>{label}</span>
                  <span style={{ color: 'var(--t0)', fontWeight: 400 }}>{value}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ padding: 32, background: '#1a1612', position: 'relative', overflow: 'hidden' }}>
                <div className="absolute inset-0 orn-bg" style={{ opacity: 0.06 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>Включено у партнерський пакет</p>
                  {[
                    'Персональний менеджер',
                    'Каталог з оптовими цінами',
                    'Маркетингові матеріали (фото, відео)',
                    'Сертифікат автентичності',
                    'Приоритетне виробництво',
                    'Щомісячні нові надходження',
                    'Навчання продавців',
                    'Повернення неліквіду (після 6 міс.)',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                      <Check size={14} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner form */}
      <section className="section" id="partner-form">
        <div className="page-wrap">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-16">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span style={{ width: 28, height: 1, background: 'var(--gold)', display: 'block' }} />
                <span style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--gold)' }}>Заявка</span>
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 300, color: 'var(--t0)', paddingBottom: 14, borderBottom: '1px solid var(--bd)', marginBottom: 20 }}>
                Стати<br /><em style={{ fontStyle: 'italic', color: 'var(--gold-d)' }}>партнером</em>
              </h2>
              <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7 }}>
                Заповніть форму і наш партнерський менеджер зв'яжеться з вами протягом 24 годин.
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="field-wrap"><label className="field-label">Назва компанії *</label><input className="field-input" placeholder="ТОВ «Магазин»" {...register('company', { required: true })} /></div>
                <div className="field-wrap"><label className="field-label">Контактна особа *</label><input className="field-input" placeholder="Марія Коваленко" {...register('contact', { required: true })} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="field-wrap"><label className="field-label">Email *</label><input type="email" className="field-input" placeholder="business@company.ua" {...register('email', { required: true })} /></div>
                <div className="field-wrap"><label className="field-label">Телефон</label><input type="tel" className="field-input" placeholder="+38 (0XX) XXX-XX-XX" {...register('phone')} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="field-wrap">
                  <label className="field-label">Тип партнерства</label>
                  <select className="field-input" {...register('type')}>
                    <option value="retail">Роздрібний магазин</option>
                    <option value="online">Онлайн-ритейл</option>
                    <option value="corporate">Корпоративні замовлення</option>
                    <option value="designer">Дизайнер / колаборація</option>
                    <option value="other">Інше</option>
                  </select>
                </div>
                <div className="field-wrap">
                  <label className="field-label">Очікуваний обсяг / місяць</label>
                  <select className="field-input" {...register('volume')}>
                    <option value="5-10">5-10 виробів</option>
                    <option value="10-30">10-30 виробів</option>
                    <option value="30-100">30-100 виробів</option>
                    <option value="100+">100+ виробів</option>
                  </select>
                </div>
              </div>
              <div className="field-wrap"><label className="field-label">Додаткова інформація</label><textarea rows={4} className="field-input" style={{ resize: 'none' }} placeholder="Розкажіть про ваш бізнес та що шукаєте..." {...register('message')} /></div>
              <button type="submit" disabled={isSubmitting} className="btn-dark" style={{ alignSelf: 'flex-start', opacity: isSubmitting ? 0.6 : 1 }}>
                {isSubmitting ? 'Надсилаємо...' : <><span>Надіслати заявку</span> <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
