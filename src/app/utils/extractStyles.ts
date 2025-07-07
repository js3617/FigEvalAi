// Figma SceneNode에서 CSS 스타일을 추출하는 함수
// 해당 함수는 단일 노드에 대해 width, height, 색상, 테두리, 텍스트 스타일 등을 변환하여 CSS 형식의 객체로 반환 
export function extractStyles(node : SceneNode): Record<string, string> {
    const style: Record<string, string> = {};

    // 너비 및 높이 정보
    style.width = `${node.width}px`;
    style.height = `${node.height}px`;

    // 배경색 추출 (배경 채우기 색상 중 첫 번째 fill이 SOLID일 경우만 처리)
    if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
        const fill = node.fills[0];
        if (fill.type === 'SOLID') {
            const {r, g, b} = fill.color;
            style.backgroundColor = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
                b * 255
            )})`;
        }
    }

    // 테두리 색상 추출 (strokes 중 첫 번째가 SOLID인 경우에만 처리)
    if ('strokes' in node && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID') {
            const {r, g, b} = stroke.color;
            style.border = `1px solid rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
                b * 255
            )})`;
        }
    }

    // border-radius 추출 (숫자형 cornerRadius가 존재할 경우)
    if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
        style.borderRadius = `${node.cornerRadius}px`;
    }

    // Auto Layout 설정이 되어 있는 경우 flexbox 관련 CSS 추출
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
        style.display = 'flex';

        // 방향
        style.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
        // 주축 정렬 방식 → justify-content로 매핑
        if ('primaryAxisAlignItems' in node) {
            style.justifyContent = {
                MIN: 'flex-start',
                CENTER: 'center',
                MAX: 'flex-end',
                SPACE_BETWEEN: 'space-between'
            }[node.primaryAxisAlignItems];
        }

        // 교차축 정렬 방식 → align-items로 매핑
        if ('counterAxisAlignItems' in node) {
            style.alignItems = {
                MIN: 'flex-start',
                CENTER: 'center',
                MAX: 'flex-end',
                BASELINE: 'baseline'
            }[node.counterAxisAlignItems];
        }

        // 아이템 간 간격 → gap 속성
        if ('itemSpacing' in node) {
            style.gap = `${node.itemSpacing}px`;
        }

        // padding 값 존재 시 → shorthand 형태로 설정 (top right bottom left)
        if ('paddingLeft' in node && 'paddingTop' in node) {
            style.padding = `${node.paddingTop}px ${node.paddingRight}px ${node.paddingBottom}px ${node.paddingLeft}px`;
        }
    }

    // 텍스트 노드일 경우, 폰트 및 텍스트 관련 CSS 속성 추출
    if (node.type === 'TEXT') {
        const textNode = node as TextNode;

        // 글자 크기
        if (textNode.fontSize !== figma.mixed) {
            style.fontSize = `${textNode.fontSize}px`;
        }

        // 글자 패밀리
        if (textNode.fontName !== figma.mixed) {
            style.fontFamily = textNode.fontName.family;
        }

        // 줄간격 (line-height)
        if (
            textNode.lineHeight !== figma.mixed &&
            textNode.lineHeight.unit === 'PIXELS'
        ) {
            style.lineHeight = `${textNode.lineHeight.value}px`;
        }

        // 자간 (letter-spacing)
        if (
            textNode.letterSpacing !== figma.mixed &&
            textNode.letterSpacing.unit === 'PIXELS'
        ) {
            style.letterSpacing = `${textNode.letterSpacing.value}px`;
        }

        // 정렬 (left, center, right)
        if (typeof textNode.textAlignHorizontal === 'string') {
            style.textAlign = textNode.textAlignHorizontal.toLowerCase();
        }

        // 글자 색상
        if (textNode.fills && Array.isArray(textNode.fills)) {
        const fill = textNode.fills[0];
        if (fill?.type === 'SOLID') {
            const { r, g, b } = fill.color;
            style.color = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
        }
        }
    }

    return style;
}


// 주어진 SceneNode 및 그 하위 자식 노드까지 재귀적으로 탐색하여 모든 스타일을 추출하는 함수
// Figma의 SceneNode (FRAME, GROUP, TEXT, RECTANGLE 등)
// 스타일 정보가 포함된 객체 배열 [{ name, type, styles }]
export function extractStylesRecursive(node : SceneNode): any[]{
    const results: any[] = [];

    // 현재 노드의 스타일 추출
    results.push({name: node.name, type: node.type, styles: extractStyles(node)});

    // 자식 노드가 있다면 재귀적으로 탐색
    if ('children' in node) {
        for (const child of node.children) {
            results.push(...extractStylesRecursive(child));
        }
    }

    return results;
}
