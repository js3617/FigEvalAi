// compareImages.js
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function compareFrameWithRef(frameFile, refFile, styles = [], requirements = '', frameStyles = null, userId = 'default') {
    const framePath = path.join(__dirname, 'uploads', userId, 'frame', frameFile);
    const refPath = path.join(__dirname, 'uploads', userId, 'ref', refFile);

    if (!fs.existsSync(framePath)) 
        throw new Error(`Frame not found: ${frameFile}`);
    if (!fs.existsSync(refPath)) 
        throw new Error(`Ref not found: ${refFile}`);
    
    const base64Frame = fs.readFileSync(framePath, 'base64');
    const base64Ref = fs.readFileSync(refPath, 'base64');

    const styleText = styles.length > 0 ? styles.join(', ') : '전체 레이아웃, 색상, 타이포그래피';

    const extractedStyleText = Array.isArray(frameStyles) && frameStyles.length > 0
    ? '\n\nFrame 요소 스타일 정보:\n' + frameStyles.map(el => {
        return `- ${el.name} (${el.type}): ${Object.entries(el.styles).map(
            ([key, value]) => `${key}: ${value}`
        ).join(', ')}`;
        }).join('\n')
    : '';

    console.log('Extracted Styles:', extractedStyleText); // 디버깅용

    const prompt = `다음은 사용자 프레임과 참고 이미지를 비교하는 작업입니다.\n\n중점적으로 비교할 스타일 요소는: ${styleText}입니다.\n` +
        `다음으로 CRAP 원칙(Contrast, Repetition, Alignment, Proximity)을 적용하여 디자인 유사도를 평가해주세요.\n\n` +
        (requirements ? `추가 요구사항: ${requirements}\n` : '') +
        extractedStyleText +
    `\n\n프레임과 참고 이미지 간의 디자인 유사도를 평가하고 피드백을 간결하게 설명해주세요.`;

    console.log('Prompt:', prompt); // 디버깅용

    const response = await openai
        .chat
        .completions
        .create({
            // model: 'gpt-4o',
            model: 'gpt-4-turbo',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt
                        }, {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/png;base64,${base64Frame}`
                            }
                        }, {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/png;base64,${base64Ref}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        });

    return response
        .choices[0]
        .message
        .content;
}

module.exports = {
    compareFrameWithRef
};
