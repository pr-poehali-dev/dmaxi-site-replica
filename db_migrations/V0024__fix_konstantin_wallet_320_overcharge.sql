-- Исправление: удаляем ошибочную транзакцию topup 320₽ у Константина (id=3)
-- Эта транзакция возникла из-за бага в вебхуке ЮКасса (отсутствовало type=shop в metadata)
-- Фактически это была оплата товара в магазине картой, а не пополнение кошелька

-- Корректируем баланс кошелька (520 - 320 = 200)
UPDATE t_p90995829_dmaxi_site_replica.wallets
SET balance = 200.00, updated_at = NOW()
WHERE user_id = 3;

-- Добавляем корректирующую транзакцию для прозрачности истории
INSERT INTO t_p90995829_dmaxi_site_replica.wallet_transactions
  (wallet_id, user_id, type, amount, balance_after, description)
VALUES (
  3, 3, 'admin_adjust', -320.00, 200.00,
  'Корректировка: отмена ошибочного зачисления (покупка товара в магазине была ошибочно записана как пополнение кошелька)'
);

-- Помечаем payment_order как ошибочный
UPDATE t_p90995829_dmaxi_site_replica.payment_orders
SET status = 'error_corrected'
WHERE id = 5 AND user_id = 3 AND amount = 320.00;
