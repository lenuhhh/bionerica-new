-- ============================================
-- Push Notifications Tables
-- ============================================
-- Создание таблицы для сохранения push подписок

-- Таблица для хранения push-подписок пользователей
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Web Push API данные
  endpoint TEXT NOT NULL UNIQUE,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  
  -- Метаданные
  user_agent TEXT,
  ip_address INET,
  active BOOLEAN DEFAULT true NOT NULL,
  
  -- Временные метки
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Индексы для производительности
  CONSTRAINT push_subscriptions_user_id_unique UNIQUE(user_id, endpoint)
);

-- Индексы
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx 
  ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_active_idx 
  ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS push_subscriptions_updated_at_idx 
  ON push_subscriptions(updated_at);

-- Таблица для логирования отправленных уведомлений
CREATE TABLE IF NOT EXISTS push_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  tag TEXT DEFAULT 'bionerica-notification',
  
  -- Отправка
  recipient_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Планирование
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Администратор который отправил
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Дополнительные данные
  error_log JSONB,
  metadata JSONB
);

-- Индексы для логов
CREATE INDEX IF NOT EXISTS push_notification_logs_sent_at_idx 
  ON push_notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS push_notification_logs_admin_id_idx 
  ON push_notification_logs(admin_id);
CREATE INDEX IF NOT EXISTS push_notification_logs_tag_idx 
  ON push_notification_logs(tag);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Включить RLS для push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только свои подписки
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может создавать подписки для себя
CREATE POLICY "Users can create own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может удалять свои подписки
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Админ может просматривать и управлять подписками
CREATE POLICY "Admins can view all push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Включить RLS для логов уведомлений
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Только администраторы могут видеть логи
CREATE POLICY "Admins can view push notification logs"
  ON push_notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Только администраторы могут создавать логи
CREATE POLICY "Admins can create push notification logs"
  ON push_notification_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- Функции и триггеры
-- ============================================

-- Функция для обновления updated_at при изменении подписки
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS push_subscriptions_updated_at_trigger 
  ON push_subscriptions;
  
CREATE TRIGGER push_subscriptions_updated_at_trigger
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- ============================================
-- Представления (Views)
-- ============================================

-- Статистика подписок
CREATE OR REPLACE VIEW push_subscription_stats AS
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE active = true) as active_subscriptions,
  COUNT(*) FILTER (WHERE active = false) as inactive_subscriptions,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(updated_at) as last_activity,
  COUNT(CASE WHEN created_at > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as created_last_7_days
FROM push_subscriptions;

-- Статистика отправок
CREATE OR REPLACE VIEW push_notification_stats AS
SELECT 
  DATE_TRUNC('day', sent_at) as day,
  COUNT(*) as notifications_sent,
  SUM(success_count) as total_success,
  SUM(failed_count) as total_failed,
  AVG(success_count::FLOAT / NULLIF(recipient_count, 0)) * 100 as avg_success_rate
FROM push_notification_logs
GROUP BY DATE_TRUNC('day', sent_at)
ORDER BY day DESC;

-- ============================================
-- Процедуры для обслуживания
-- ============================================

-- Удалить неактивные подписки старше 90 дней
CREATE OR REPLACE FUNCTION cleanup_old_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM push_subscriptions
  WHERE active = false 
    AND updated_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Seeding (опциональные тестовые данные)
-- ============================================

-- Создать пример подписки для тестирования (раскомментируйте для использования)
-- INSERT INTO push_subscriptions (user_id, endpoint, auth, p256dh, active)
-- VALUES (
--   (SELECT id FROM auth.users LIMIT 1),
--   'https://fcm.googleapis.com/fcm/send/test-endpoint',
--   'test-auth-key',
--   'test-p256dh-key',
--   true
-- )
-- ON CONFLICT DO NOTHING;

-- ============================================
-- Комментарии к таблицам
-- ============================================

COMMENT ON TABLE push_subscriptions IS 'Хранит Web Push API подписки пользователей для отправки push-уведомлений';
COMMENT ON TABLE push_notification_logs IS 'Логирует все отправленные push-уведомления для аудита и аналитики';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL endpoint для отправки push-уведомлений (из PushSubscription API)';
COMMENT ON COLUMN push_subscriptions.auth IS 'Ключ аутентификации для push-уведомлений (из keys.auth)';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Ключ шифрования для push-уведомлений (из keys.p256dh)';
COMMENT ON COLUMN push_notification_logs.metadata IS 'Дополнительные данные для уведомления (целевая группа, A/B тест и т.д.)';
