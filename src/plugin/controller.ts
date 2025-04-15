figma.showUI(__html__, { width: 500, height: 700 });

figma.ui.onmessage = async (msg) => {

  if (msg.type === 'export-selected-frame') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0 || !("exportAsync" in selection[0])) {
      figma.notify("먼저 Frame을 선택하세요.");
      return;
    }

    const node = selection[0];
    const bytes = await node.exportAsync({ format: "PNG" });

    // base64로 인코딩
    const base64 = figma.base64Encode(bytes);

    // UI로 전송
    figma.ui.postMessage({
      type: 'exported-image',
      dataUrl: `data:image/png;base64,${base64}`,
      filename: `${node.name.replace(/\\s+/g, '_')}_${Date.now()}.png`
    });
  }

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
