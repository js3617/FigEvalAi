figma.showUI(__html__, { width: 500, height: 700 });

figma.ui.onmessage = async (msg) => {

  if (msg.type === 'insert-image') {
    const bytes = await fetch(msg.dataUrl).then(res => res.arrayBuffer());
    const image = figma.createImage(new Uint8Array(bytes));
    const rect = figma.createRectangle();
    rect.resize(200, 200);
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
