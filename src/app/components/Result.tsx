import React from 'react';

import { Btn } from '../styles/Button'
import { TitleFont } from '../styles/Font'

interface ResultData {
    frameResult: {
        fileName: string;
        exists: boolean;
    };
    refResults: {
        fileName: string;
        exists: boolean;
        styles: string[];
        gptResult?: string;
    }[];
}

interface Props {
    data: ResultData;
    onBack: () => void;
    onReset: () => void;
}

export default function Result({ data, onBack, onReset }: Props) {
    return (
        <div style={{ padding: 20 }}>
            <h3>디자인 유사도 검증 결과</h3>
    
            <div style={{ marginBottom: 24 }}>
            <TitleFont>선택된 Frame 이미지</TitleFont>
            <img
                src={`http://localhost:3000/uploads/frame/${data.frameResult.fileName}`}
                alt="frame"
                style={{ maxWidth: "100%", border: '1px solid #aaa' }}
            />
            </div>
    
            {data.refResults.map((res, idx) => (
            <div key={idx} style={{ marginBottom: 32 }}>
                <TitleFont>참고 이미지 {idx + 1}</TitleFont>
                <img
                src={`http://localhost:3000/uploads/ref/${res.fileName}`}
                alt={`ref-${idx}`}
                style={{ maxWidth: "100%", border: '1px solid #ccc' }}
                />
                <p>선택한 스타일: {res.styles.join(', ')}</p>
                {res.gptResult ? (
                    <div style={{ marginTop: 12, background: '#f7f7f7', padding: 12, borderRadius: 4 }}>
                        <strong>GPT 비교 결과:</strong>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{res.gptResult}</p>
                    </div>
                ) : (
                    <p style={{ color: 'gray' }}>GPT 결과 없음</p>
                )}
            </div>
            ))}
    
            <Btn onClick={onBack}>이전</Btn>
            <Btn onClick={onReset}>다시 진행하기</Btn>
        </div>
    );
}