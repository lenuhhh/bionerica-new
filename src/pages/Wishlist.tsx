// Wishlist.tsx
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/store'
import { products } from '@/data'
import ProductCard from '@/components/ui/ProductCard'
import { Breadcrumb } from '@/components/ui'

export default function Wishlist() {
  const { ids } = useWishlist()
  const list = products.filter(p => ids.has(p.id))

  return (
    <div>
      <div className="section-sm" style={{ background: 'var(--b1)', borderBottom: '1px solid var(--bd)' }}>
        <div className="page-wrap">
          <Breadcrumb items={[{ label: 'Головна', to: '/' }, { label: 'Список бажань' }]} />
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: 'var(--t0)', marginTop: 12 }}>
            Список бажань <span style={{ fontSize: '0.5em', color: 'var(--t2)' }}>({list.length})</span>
          </h1>
        </div>
      </div>
      <div className="page-wrap section">
        {list.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        ) : (
          <div className="py-28 text-center flex flex-col items-center gap-6">
            <Heart size={72} strokeWidth={0.8} style={{ color: 'var(--bd)' }} />
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, color: 'var(--t0)' }}>Список порожній</h2>
            <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 8 }}>Натисніть ♡ на товарі, щоб додати до списку</p>
            <Link to="/catalog" className="btn-dark">До каталогу</Link>
          </div>
        )}
      </div>
    </div>
  )
}
