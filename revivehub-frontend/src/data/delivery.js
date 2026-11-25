// MOCK delivery estimator.
// In the real system the backend's Delivery Estimation module calculates this
// (distance between seller and buyer, weight, courier rates). This stand-in is
// deterministic so the demo behaves the same every time, and it shows the
// feasibility rule from the documentation: if delivery costs too much compared
// with the goods, suggest buyer pickup instead.

const MAX_DELIVERY_SHARE_OF_GOODS = 0.25; // delivery above 25% of goods value is "not economical"

export function estimateDelivery(postalCode, quantity, goodsValue) {
  const digits = postalCode.replace(/\D/g, '');
  const digitSum = digits.split('').reduce((sum, d) => sum + Number(d), 0);

  const distanceKm = 80 + ((digitSum * 37) % 1400);
  const cost = Math.round(250 + distanceKm * Math.min(quantity, 50) * 0.12);

  let days = '3–4 days';
  if (distanceKm >= 900) days = '5–7 days';
  else if (distanceKm >= 300) days = '4–6 days';

  const feasible = cost <= goodsValue * MAX_DELIVERY_SHARE_OF_GOODS;

  return { distanceKm, cost, days, feasible };
}
