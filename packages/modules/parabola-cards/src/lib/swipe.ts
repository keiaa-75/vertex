import type { Direction } from './generator';

export function swipe(node: HTMLElement, onSwipe: (dir: Direction) => void) {
  let startX: number;
  let startY: number;
  const threshold = 50;

  function handleDown(e: PointerEvent) {
    startX = e.clientX;
    startY = e.clientY;
    node.setPointerCapture(e.pointerId);
  }

  function handleUp(e: PointerEvent) {
    const diffX = e.clientX - startX;
    const diffY = e.clientY - startY;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    if (Math.max(absX, absY) > threshold) {
      let direction: Direction;
      if (absX > absY) {
        direction = diffX > 0 ? 'RIGHT' : 'LEFT';
      } else {
        direction = diffY > 0 ? 'DOWN' : 'UP';
      }
      onSwipe(direction); // Call the function directly
    }
  }

  node.addEventListener('pointerdown', handleDown);
  node.addEventListener('pointerup', handleUp);

  return {
    destroy() {
      node.removeEventListener('pointerdown', handleDown);
      node.removeEventListener('pointerup', handleUp);
    }
  };
}