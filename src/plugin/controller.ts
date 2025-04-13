figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-rectangles') {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < msg.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === 'insert-image') {
    const bytes = await fetch(msg.dataUrl).then(res => res.arrayBuffer());
    const image = figma.createImage(new Uint8Array(bytes));
    const rect = figma.createRectangle();
    rect.resize(300, 300);
    rect.fills = [{
      type: 'IMAGE',
      scaleMode: 'FILL',
      imageHash: image.hash
    }];
    figma.currentPage.appendChild(rect);
    figma.viewport.scrollAndZoomIntoView([rect]);
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
