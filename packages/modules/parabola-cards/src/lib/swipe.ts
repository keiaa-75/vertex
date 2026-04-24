import type { Direction } from './generator';

export function swipe(node: HTMLElement, onSwipe: (dir: Direction) => void) {
  let startX = 0;
  let startY = 0;
  let active = false;
  const THRESHOLD = 40;

  function handleDown(e: PointerEvent) {
    startX = e.clientX;
    startY = e.clientY;
    active = true;
    node.setPointerCapture(e.pointerId);
  }

  function handleUp(e: PointerEvent) {
    if (!active) return;
    active = false;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < THRESHOLD) return;

    const direction: Direction = absDx > absDy
      ? (dx > 0 ? 'RIGHT' : 'LEFT')
      : (dy > 0 ? 'DOWN' : 'UP');

    onSwipe(direction);
  }

  function handleCancel() { active = false; }

  node.addEventListener('pointerdown', handleDown);
  node.addEventListener('pointerup', handleUp);
  node.addEventListener('pointercancel', handleCancel);

  return {
    destroy() {
      node.removeEventListener('pointerdown', handleDown);
      node.removeEventListener('pointerup', handleUp);
      node.removeEventListener('pointercancel', handleCancel);
    }
  };
}