export interface DragConfig {
    partId: string;
    onDrop: (targetSlotId: string | null) => void;
}

export function usePointerDrag(node: HTMLElement, config: DragConfig) {
    let ghost: HTMLElement | null = null;
    let isDragging = false;
    let grabOffsetX = 0;
    let grabOffsetY = 0;

    function createGhost(e: PointerEvent) {
        const rect = node.getBoundingClientRect();
        grabOffsetX = e.clientX - rect.left;
        grabOffsetY = e.clientY - rect.top;

        ghost = node.cloneNode(true) as HTMLElement;
        ghost.style.cssText = `
            position: fixed;
            left: 0; top: 0;
            width: ${rect.width}px;
            height: ${rect.height}px;
            pointer-events: none;
            opacity: 0.85;
            z-index: 9999;
            transform: translate(${e.clientX - grabOffsetX}px, ${e.clientY - grabOffsetY}px) scale(1.06);
            margin: 0;
        `;
        document.body.appendChild(ghost);
    }

    function onPointerDown(e: PointerEvent) {
        if (e.button !== 0) return;
        isDragging = true;
        node.setPointerCapture(e.pointerId);
        createGhost(e);
        node.style.opacity = '0.3';
    }

    function onPointerMove(e: PointerEvent) {
        if (!isDragging || !ghost) return;
        ghost.style.transform =
            `translate(${e.clientX - grabOffsetX}px, ${e.clientY - grabOffsetY}px) scale(1.06)`;
    }

    function onPointerUp(e: PointerEvent) {
        if (!isDragging) return;
        isDragging = false;
        node.releasePointerCapture(e.pointerId);
        node.style.opacity = '1';
        ghost?.remove();
        ghost = null;

        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const slotEl = hit?.closest('[data-slot-id]') as HTMLElement | null;
        config.onDrop(slotEl?.dataset.slotId ?? null);
    }

    function onPointerCancel() {
        if (!isDragging) return;
        isDragging = false;
        node.style.opacity = '1';
        ghost?.remove();
        ghost = null;
    }

    // All listeners on node — setPointerCapture redirects all events here anyway
    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
    node.addEventListener('pointercancel', onPointerCancel);

    return {
        destroy() {
            node.removeEventListener('pointerdown', onPointerDown);
            node.removeEventListener('pointermove', onPointerMove);
            node.removeEventListener('pointerup', onPointerUp);
            node.removeEventListener('pointercancel', onPointerCancel);
        }
    };
}