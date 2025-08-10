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
    userId: string; // 사용자 번호 추가
    onBack: () => void;
    onReset: () => void;
}

export default function Result({ data, userId, onBack, onReset }: Props) {
    const actualUserId = `PID_${userId}`;
    
    // 디버깅용 로그
    console.log('Result 컴포넌트 데이터:', data);
    console.log('사용자 ID:', userId, '실제 ID:', actualUserId);
    console.log('Frame 이미지 URL:', `http://localhost:3000/uploads/${actualUserId}/frame/${data.frameResult.fileName}`);
    
    return (
        <div style={{ padding: 20 }}>
            <h3>디자인 유사도 검증 결과</h3>
    
            <div style={{ marginBottom: 24 }}>
            <TitleFont>선택된 Frame 이미지</TitleFont>
            <img
                src={`http://localhost:3000/uploads/${actualUserId}/frame/${data.frameResult.fileName}`}
                alt="frame"
                style={{ maxWidth: "100%", border: '1px solid #aaa' }}
                onError={(e) => {
                    console.error('Frame 이미지 로드 실패:', e.currentTarget.src);
                }}
                onLoad={() => {
                    console.log('Frame 이미지 로드 성공');
                }}
            />
            </div>
    
            {data.refResults.map((res, idx) => (
            <div key={idx} style={{ marginBottom: 32 }}>
                <TitleFont>참고 이미지 {idx + 1}</TitleFont>
                <img
                src={`http://localhost:3000/uploads/${actualUserId}/ref/${res.fileName}`}
                alt={`ref-${idx}`}
                style={{ maxWidth: "100%", border: '1px solid #ccc' }}
                onError={(e) => {
                    console.error(`참고 이미지 ${idx + 1} 로드 실패:`, e.currentTarget.src);
                }}
                onLoad={() => {
                    console.log(`참고 이미지 ${idx + 1} 로드 성공`);
                }}
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