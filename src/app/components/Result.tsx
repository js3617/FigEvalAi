import React from 'react';
import { Btn } from '../styles/Button'

interface ResultData {
    frameResult: {
        fileName: string;
        exists: boolean;
    };
    refResults: {
        fileName: string;
        exists: boolean;
    }[];
}

interface Props {
    data: ResultData;
    onBack: () => void;
}

export default function Result({ data, onBack }: Props) {
    return (
        <div style={{ padding: 20 }}>
            <h3>디자인 유사도 검증 결과</h3>
    
            <div style={{ marginBottom: 24 }}>
            <p><strong>선택된 Frame 이미지</strong></p>
            <img
                src={`http://localhost:3000/uploads/frame/${data.frameResult.fileName}`}
                alt="frame"
                style={{ maxWidth: "100%", border: '1px solid #aaa' }}
            />
            </div>
    
            {data.refResults.map((res, idx) => (
            <div key={idx} style={{ marginBottom: 32 }}>
                <p><strong>참고 이미지 {idx + 1}</strong></p>
                <img
                src={`http://localhost:3000/uploads/ref/${res.fileName}`}
                alt={`ref-${idx}`}
                style={{ maxWidth: "100%", border: '1px solid #ccc' }}
                />
                {/* <p>이미지 존재 여부: {res.exists ? '있음' : '없음'}</p> */}
            </div>
            ))}
    
            <Btn onClick={onBack}>이전</Btn>
        </div>
    );
}