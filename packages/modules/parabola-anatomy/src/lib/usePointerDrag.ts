export interface DragConfig {
    partId: string;
    onDrop: (targetSlotId: string | null) => void;
}

export function usePointerDrag(node: HTMLElement, config: DragConfig) {
    let startX = 0, startY = 0;
    let ghost: HTMLElement | null = null;
    let isDragging = false;

    function createGhost() {
        ghost = node.cloneNode(true) as HTMLElement;
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.opacity = '0.85';
        ghost.style.zIndex = '9999';
        ghost.style.transform = `translate(${startX}px, ${startY}px) scale(1.04)`;
        document.body.appendChild(ghost);
    }

    function onPointerDown(e: PointerEvent) {
        if (e.button !== 0) return;
        isDragging = true;
        node.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startY = e.clientY;
        createGhost();
        node.style.opacity = '0.3';
    }

    function onPointerMove(e: PointerEvent) {
        if (!isDragging || !ghost) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        ghost.style.transform = `translate(${startX + dx}px, ${startY + dy}px) scale(1.04)`;
    }

    function onPointerUp(e: PointerEvent) {
        if (!isDragging) return;
        isDragging = false;
        node.releasePointerCapture(e.pointerId);
        node.style.opacity = '1';
        ghost?.remove();
        ghost = null;

        // Iframe-safe hit test
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const slotEl = hit?.closest('[data-slot-id]') as HTMLElement | null;
        config.onDrop(slotEl?.dataset.slotId || null);
    }

    node.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return {
        destroy() {
           node.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp); 
        }
    };
}