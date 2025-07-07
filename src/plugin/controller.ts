import { extractStylesRecursive } from '../app/utils/extractStyles';

figma.showUI(__html__, { width: 500, height: 700 });

figma.ui.onmessage = async (msg) => {

  if (msg.type === 'export-selected-frame') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0 || !("exportAsync" in selection[0])) {
      figma.notify("먼저 Frame을 선택하세요.");
      return;
    }

    if (selection.length > 1) {
      figma.notify("하나의 Frame만 선택하세요.");
      return;
    }

    const node = selection[0];

    figma.notify("선택이 완료되었습니다.");

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

  //Figma에 이미지 삽입
  // if (msg.type === 'insert-image') {
  //   const bytes = await fetch(msg.dataUrl).then(res => res.arrayBuffer());
  //   const image = figma.createImage(new Uint8Array(bytes));
  //   const rect = figma.createRectangle();
  //   rect.resize(200, 200);
  //   rect.fills = [{
  //     type: 'IMAGE',
  //     scaleMode: 'FILL',
  //     imageHash: image.hash
  //   }];
  //   figma.currentPage.appendChild(rect);
  //   figma.viewport.scrollAndZoomIntoView([rect]);
  // }

  if (msg.type === 'extract-css') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.notify("먼저 Frame을 선택하세요.");
      return;
    }

    if (selection.length > 1) {
      figma.notify("하나의 Frame만 선택하세요.");
      return;
    }

    const frame = selection[0];

    if (frame.type !== 'FRAME' && frame.type !== 'GROUP') {
      figma.notify("Frame 또는 Group을 선택하세요.");
      return;
    }

    // const children = 'children' in frame ? frame.children : [];
    // const result = children.map((node) => ({
    //   name: node.name,
    //   type: node.type,
    //   styles: extractStyles(node)
    // }));
    const result = extractStylesRecursive(frame);

    console.log('추출된 스타일:', result);

    figma.ui.postMessage({
      type: 'extracted-css',
      styles: result
    });
  }
  
  // Plugin 종료
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }

  // Plugin에서 UI로 메시지 전송
  if (msg.type === 'notify') {
    figma.notify(msg.message);
  }  
};
