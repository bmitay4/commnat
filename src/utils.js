// Format a millisecond difference into human readable "X months, Y days" etc.
export function formatTimeLeft(diffMs) {
  if (diffMs <= 0) return 'Ending soon';

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months    = Math.floor(totalDays / 30);
  const days      = totalDays % 30;
  const hours     = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (months > 0 && days > 0)  return `${months}mo ${days}d`;
  if (months > 0)               return `${months} months`;
  if (days > 1)                 return `${days} days`;
  if (days === 1)               return `1 day ${hours}h`;
  return `${hours}h`;
}
