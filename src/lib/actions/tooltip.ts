import './tooltip.css';

export function tooltip(node: HTMLElement, text: string) {
  let tooltipNode: HTMLDivElement;

  function handleMouseEnter() {
    tooltipNode = document.createElement('div');
    tooltipNode.className = 'sa-tooltip';
    tooltipNode.textContent = text;
    document.body.appendChild(tooltipNode);

    const nodeRect = node.getBoundingClientRect();
    const tooltipRect = tooltipNode.getBoundingClientRect();

    let top = nodeRect.top - tooltipRect.height - 8;
    let left = nodeRect.left + (nodeRect.width / 2) - (tooltipRect.width / 2);

    if (top < 0) {
      top = nodeRect.bottom + 8;
      tooltipNode.classList.add('sa-tooltip-bottom');
    }

    tooltipNode.style.top = `${top}px`;
    tooltipNode.style.left = `${left}px`;
    
    // Trigger transition
    requestAnimationFrame(() => {
      tooltipNode.style.opacity = '1';
      tooltipNode.style.transform = tooltipNode.classList.contains('sa-tooltip-bottom') ? 'translateY(0) scale(1)' : 'translateY(0) scale(1)';
    });
  }

  function handleMouseLeave() {
    if (tooltipNode) {
      tooltipNode.style.opacity = '0';
      tooltipNode.style.transform = tooltipNode.classList.contains('sa-tooltip-bottom') ? 'translateY(-4px) scale(0.95)' : 'translateY(4px) scale(0.95)';
      
      const nodeToRemove = tooltipNode;
      setTimeout(() => {
        if (document.body.contains(nodeToRemove)) {
          document.body.removeChild(nodeToRemove);
        }
      }, 150); // Matches CSS transition duration
    }
  }

  node.addEventListener('mouseenter', handleMouseEnter);
  node.addEventListener('mouseleave', handleMouseLeave);

  return {
    update(newText: string) {
      text = newText;
      if (tooltipNode) {
        tooltipNode.textContent = text;
      }
    },
    destroy() {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
      if (tooltipNode && document.body.contains(tooltipNode)) {
        document.body.removeChild(tooltipNode);
      }
    }
  };
}
