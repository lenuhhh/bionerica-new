import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReviews } from '@/hooks/useReviews';

const SLIDE_WIDTH = 370; // px, ширина одного отзыва (адаптируйте под ваш дизайн)
const GAP = 24; // px, отступ между отзывами
const AUTO_SCROLL_SPEED = 0.5; // px per frame

const ReviewsSlider: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  // Получаем отзывы из БД
  const { reviews, loading, error } = useReviews(12);
  const realReviews = reviews.filter(r => Boolean(r.user_id));
  const shouldAutoScroll = realReviews.length > 4;
  // Дублируем только когда нужен бесконечный эффект
  const extendedReviews = shouldAutoScroll ? [...realReviews, ...realReviews] : realReviews;
  const totalSlides = extendedReviews.length;
  const totalWidth = totalSlides * (SLIDE_WIDTH + GAP);

  // Автопрокрутка
  useEffect(() => {
    if (!shouldAutoScroll) return;

    let frame: number;
    const scroll = () => {
      if (shouldAutoScroll && !isPaused && containerRef.current) {
        let newScrollLeft = containerRef.current.scrollLeft + AUTO_SCROLL_SPEED;
        if (newScrollLeft >= totalWidth / 2) {
          // Сброс к началу (loop)
          newScrollLeft = 0;
        }
        containerRef.current.scrollLeft = newScrollLeft;
      }
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [isPaused, totalWidth, shouldAutoScroll]);

  // Drag/Swipe
  const onPointerDown = (e: React.PointerEvent) => {
    if (!shouldAutoScroll) return;
    setIsPaused(true);
    setDragStartX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX !== null && containerRef.current && shouldAutoScroll) {
      const dx = dragStartX - e.clientX;
      let newScrollLeft = containerRef.current.scrollLeft + dx;
      if (newScrollLeft < 0) newScrollLeft = totalWidth / 2 + newScrollLeft;
      if (newScrollLeft >= totalWidth / 2) newScrollLeft = newScrollLeft - totalWidth / 2;
      containerRef.current.scrollLeft = newScrollLeft;
      setDragStartX(e.clientX);
    }
  };
  const onPointerUp = () => {
    if (!shouldAutoScroll) return;
    setIsPaused(false);
    setDragStartX(null);
  };

  if (loading) return <div className="py-12 text-center text-[#b3a98f]">Завантаження відгуків…</div>;
  if (error) return <div className="py-12 text-center text-red-400">Помилка: {error}</div>;
  if (!realReviews.length) {
    return (
      <div className="page-wrap py-6">
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            padding: '36px clamp(20px,4vw,46px)',
            border: '1px solid rgba(122,93,52,0.34)',
            background: 'linear-gradient(180deg, rgba(33,28,22,0.9) 0%, rgba(28,24,19,0.95) 100%)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
            Відгуки клієнтів
          </p>
          <h3
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(28px,4.6vw,44px)',
              fontWeight: 300,
              color: 'rgba(245,240,232,0.92)',
              lineHeight: 1.12,
              marginBottom: 10,
            }}
          >
            Тут скоро з'являться
            <em style={{ color: 'var(--gold-l)', fontStyle: 'italic' }}> перші відгуки</em>
          </h3>
          <p style={{ color: 'rgba(245,240,232,0.56)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            Поки що немає відгуків від авторизованих користувачів. Станьте першим, хто поділиться досвідом.
          </p>
          <Link to="/reviews?write=1" className="btn-gold" style={{ display: 'inline-flex' }}>
            Залишити перший відгук
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap py-8">
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={() => shouldAutoScroll && setIsPaused(true)}
        onMouseLeave={() => shouldAutoScroll && setIsPaused(false)}
      >
        <div
          ref={containerRef}
          className={`flex gap-6 select-none ${shouldAutoScroll ? 'cursor-grab' : 'justify-center flex-wrap'}`}
          style={{
            width: '100%',
            overflowX: shouldAutoScroll ? 'auto' : 'visible',
            scrollBehavior: 'auto',
            scrollbarWidth: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={dragStartX !== null && shouldAutoScroll ? onPointerMove : undefined}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {extendedReviews.map((review, idx) => (
            <div
              key={review.id ? `${review.id}-${idx}` : idx}
              className="p-5 sm:p-7 md:p-8 min-w-[84vw] max-w-[84vw] sm:min-w-[320px] sm:max-w-[320px] md:min-w-[370px] md:max-w-[370px] flex-shrink-0 flex flex-col justify-between"
              style={{
                width: SLIDE_WIDTH,
                background: 'linear-gradient(180deg, rgba(34,29,23,0.94) 0%, rgba(29,25,20,0.98) 100%)',
                border: '1px solid rgba(122,93,52,0.34)',
                boxShadow: '0 20px 46px rgba(0,0,0,0.2)',
              }}
            >
              <div className="mb-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < review.rating ? "text-yellow-400 text-lg" : "text-[#8d7a5b] text-lg"}>★</span>
                  ))}
                </div>
                <div className="italic text-lg" style={{ color: 'rgba(245,240,232,0.9)' }}>"{review.text}"</div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-[#c0a068] flex items-center justify-center text-[#181611] font-bold text-lg">
                  {review.author?.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <div className="font-medium" style={{ color: 'rgba(245,240,232,0.92)' }}>{review.author}</div>
                  <div className="text-sm" style={{ color: 'rgba(245,240,232,0.48)' }}>{review.created_at?.slice(0, 10)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsSlider;
