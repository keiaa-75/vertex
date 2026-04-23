export type SwipeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export function swipe(node: HTMLElement, threshold = 50) {
  let startX: number;
  let startY: number;

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
      let direction: SwipeDirection;
      if (absX > absY) {
        direction = diffX > 0 ? 'RIGHT' : 'LEFT';
      } else {
        direction = diffY > 0 ? 'DOWN' : 'UP';
      }
      node.dispatchEvent(new CustomEvent('swipe', { detail: direction }));
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