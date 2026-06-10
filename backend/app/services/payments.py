"""
수납 반영 서비스 (다음 단계 구현 예정)
------------------------------------
프로토타입 App.jsx 의 applyPayment 로직을 서버로 이식할 자리.
계획:
  1. 입금액 amount 로 차감 가능한 개월수 k = min(미수월수, amount // 월부과액)
  2. receivable_items 중 오래된 k개를 is_paid=True 로
  3. payments 행 k개 생성 (method, paid_date, deposit_id)
  4. members.last_payment_ym 갱신
  ※ 어떤 경우에도 기존 행을 DELETE 하지 않는다 (is_paid 플래그만 갱신).
"""
