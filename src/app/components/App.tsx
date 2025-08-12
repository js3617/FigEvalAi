import React, { useState, useEffect, useRef } from 'react';
import { dataURLtoBlob } from '../utils/dataURLtoBlob';

import ApiClient from '../utils/ApiClient';

import Result from './Result';

import '../styles/ui.css';

import { Btn, CancelBtn } from '../styles/Button'
import { Label } from '../styles/Label'
import { Content, RefContent, BtnWrap, BtnStartWrap, RowGap, ColumnGap, TextArea, Input } from '../styles/Layout'
import { TitleFont } from '../styles/Font'

import LoadingModal from './LoadingModal';

type ResultData = {
  frameResult: {
    fileName: string;
    exists: boolean;
  };
  refResults: {
    fileName: string;
    exists: boolean;
    styles: string[];
  }[];
};

function App() {

  const [resultData, setResultData] = useState<null | ResultData>(null);
  
  const [previewList, setPreviewList] = useState<{ url: string; filename: string }[]>([]); //미리 보기 저장
  const [frameImage, setFrameImage] = useState<{ url: string; filename: string } | null>(null);
  
  const fileInputRef = useRef(null); // 파일 입력 참조

  const [requirements, setRequirements] = useState(''); // 요청 데이터 저장

  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  const [selectedStyles, setSelectedStyles] = useState<StyleOption[][]>([]); // 선택된 스타일 요소 저장

  const [userId, setUserId] = useState(''); // 사용자 ID 저장
  const userIdRef = useRef(userId); // userId 참조를 위한 ref

  // userId가 변경될 때마다 ref 업데이트
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // 스타일 추출
  const [extractedStyles, setExtractedStyles] = useState<any[]>([]);

  const styleOptions = ['색상', '폰트', '대조', '여백', '복잡도', '구조'] as const;
  type StyleOption = typeof styleOptions[number];


  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  const selectFrame = () => {
    if (!userId.trim()) {
      parent.postMessage({ pluginMessage: { type: 'notify', message: '실험자 번호를 먼저 입력해주세요.' } }, '*');
      return;
    }
    parent.postMessage({ pluginMessage: { type: 'export-selected-frame' } }, '*'),
    parent.postMessage({ pluginMessage: { type: 'extract-css' } }, '*');
  };

  //참고 이미지 업로드
  const uploadToLocal = async (file: File, dataUrl: string) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId);

    const res = await ApiClient.post('/upload/ref', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const result = res.data;
    console.log('Ref서버 응답:', result);

    setPreviewList((prev) => [...prev, { url: dataUrl, filename: result.filename }]);
    setSelectedStyles((prev) => [...prev, []]);
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId.trim()) {
      parent.postMessage({ pluginMessage: { type: 'notify', message: '실험자 번호를 먼저 입력해주세요.' } }, '*');
      return;
    }

    const files = e.target.files;
      if (!files || files.length === 0) return;
  
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // setPreviewList((prev) => [...prev, { url: dataUrl, filename: result.filename }]);
      parent.postMessage(
        {
          pluginMessage: {
            type: 'insert-image',
            dataUrl,
          },
        },
        '*'
      );
        uploadToLocal(file, dataUrl);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Frame 선택 후 이미지 저장
  useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg?.type === 'exported-image') {
        const { dataUrl, filename } = msg;
  
                // userId가 없으면 에러 메시지
        const currentUserId = userIdRef.current;
        if (!currentUserId.trim()) {
          parent.postMessage({ pluginMessage: { type: 'notify', message: '실험자 번호를 먼저 입력해주세요.' } }, '*');
          return;
        }

        // base64 → Blob 변환
        const blob = dataURLtoBlob(dataUrl);
        const file = new File([blob], filename, { type: 'image/png' });

        // 서버로 전송
        const formData = new FormData();
        formData.append('image', file);
        formData.append('userId', currentUserId);

        console.log('Frame 업로드 - 사용자 번호:', currentUserId); // 디버깅용
  
        ApiClient.post('/upload/frame', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
          .then(res => {
            const result = res.data;
            setFrameImage({ url: dataUrl, filename: result.filename });
            console.log('Frame서버 응답:', result);
          })
          .catch(err => {
            console.error('Frame 업로드 실패:', err);
            parent.postMessage({ pluginMessage: { type: 'notify', message: 'Frame 업로드에 실패했습니다.' } }, '*');
          });
      }
      if (msg?.type === 'extracted-css') {
        setExtractedStyles(msg.styles || []);
        console.log('추출된 스타일 저장됨:', msg.styles);
      }
    };
  }, []); // ref 사용으로 의존성 제거

  // 참고 이미지 삭제 기능
  const removeImage = async (index: number, filename: string) => {
    try {
      await ApiClient.delete(`/upload/ref/${userId}/${filename}`);
      console.log('서버에서 삭제됨:', filename);
    } catch (err) {
      console.error('삭제 실패:', err);
    }
    setPreviewList(prev => prev.filter((_, i) => i !== index));
    setSelectedStyles(prev => prev.filter((_, i) => i !== index));
  };

  // Frame 이미지 삭제 기능
  const removeFrameImage = async () => {
    if (!frameImage) return;
    
    try {
      await ApiClient.delete(`/upload/frame/${userId}/${frameImage.filename}`);
      console.log('Frame 서버에서 삭제됨:', frameImage.filename);
    } catch (err) {
      console.error('Frame 삭제 실패:', err);
    }
    setFrameImage(null);
  };
  
  const onAddress = async () => {
    // 사용자 번호 입력 확인
    if (!userId.trim()) {
      parent.postMessage({ pluginMessage: { type: 'notify', message: '실험자 번호를 입력해주세요.' } }, '*');
      return;
    }

    // 참고 이미지 없는 경우
    if (previewList.length === 0) {
      parent.postMessage({ pluginMessage: { type: 'notify', message: '참고 이미지를 추가해주세요.' } }, '*');
      return;
    }

    // Frame 이미지 없는 경우
    if (!frameImage) {
      parent.postMessage({ pluginMessage: { type: 'notify', message: 'Frame을 먼저 선택해주세요.' } }, '*');
      return;
    }

    // 스타일 요소 선택 안한 경우
    const noneStyles = selectedStyles.some(styles => !styles || styles.length === 0);
    if (noneStyles) {
      parent.postMessage({ pluginMessage: { type: 'notify', message: '각 참고 이미지에 최소 하나의 스타일 요소를 선택해주세요.' } }, '*');
      return;
    }

    setIsLoading(true); // 로딩 시작

    try{
      const actualUserId = `PID_${userId}`;
      const refImagesData = previewList.map((item, idx) => ({
        url: `/uploads/${actualUserId}/ref/${item.filename}`,
        styles: selectedStyles[idx] || []
      }));
      
      const frameImagesUrl = frameImage ? `/uploads/${actualUserId}/frame/${frameImage.filename}` : null;

      console.log(frameImagesUrl);

      const res = await ApiClient.post('/upload/address', {
        userId,
        refImages: refImagesData,
        frameImage: frameImagesUrl,
        requirements,
        extractedStyles,
      });

      const result = res.data;
        setResultData({
          frameResult: result.frameResult,
          refResults: result.refResults,
        });
        console.log('서버 응답:', result);
    } catch (err) {
      parent.postMessage({ pluginMessage: { type: 'notify', message: 'GPT 비교 요청에 실패했습니다.' } }, '*');
      console.error('비교 실패:', err);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  // useEffect(() => {
  //   setSelectedStyles(previewList.map(() => '색상')); // 기본값 '색상'
  // }, [previewList.length]);

  // 초기화(다시 시작) - 사용자 번호는 유지
  const resetAll = () => {
    setResultData(null);
    setPreviewList([]);
    setFrameImage(null);
    setSelectedStyles([]);
    setRequirements('');
    // setUserId(''); // 사용자 번호는 유지
  };

  if (resultData) {
    return <Result 
      data={resultData}
      userId={userId}
      onBack={() => setResultData(null)} 
      onReset={resetAll} 
    />
  }

  return (
    <Content>
      <div>
        {isLoading && <LoadingModal isOpen={isLoading} />}
        {/* 실험자 ID 입력 */}
        <ColumnGap>
          <TitleFont>
            실험자 번호
          </TitleFont>
          <Input 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="실험자 번호를 입력하세요."
          />
        </ColumnGap>

        {!userId.trim() && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px',
            margin: '10px 0',
            fontSize: '14px',
            color: '#856404'
          }}>
            ⚠️ 실험자 번호를 먼저 입력해주세요. 번호 입력 후 이미지 업로드와 Frame 선택이 가능합니다.
          </div>
        )}

        {/* 선택된 Frame 이미지 표시 */}
        {frameImage && (
          <div style={{ 
            marginTop: 16, 
            padding: '16px',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <TitleFont style={{
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
              선택된 Frame
              </TitleFont>
              <CancelBtn onClick={removeFrameImage}>
                삭제
              </CancelBtn>
            </div>
            <img
              src={frameImage.url}
              alt="selected-frame"
              style={{ 
                maxWidth: '100%', 
                borderRadius: '6px',
              }}
            />
          </div>
        )}
        {previewList.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {previewList.map((item, idx) => (
            <RefContent key={idx}>
              <TitleFont>
                참고이미지 {idx + 1}
              </TitleFont>

              <RowGap>
              {/* 참고 이미지 미리보기 */}
              <img
                src={item.url}
                alt={`preview-${idx}`}
                style={{
                  maxWidth: '70%',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                }}
              />

              {/* 스타일 요소 선택 */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                {/* <div style={{ display: 'grid', gap: 10, marginBottom: 8, gridTemplateColumns: 'repeat(3, 1fr)' }}> */}
                  <ColumnGap>
                    <TitleFont>반영 스타일 요소</TitleFont>
                    {styleOptions.map((option) => (
                      <Label key={option}>
                        <input
                          type="checkbox"
                          checked={selectedStyles[idx]?.includes(option)}
                          onChange={(e) => {
                            const updated = [...selectedStyles];
                            const current = new Set(updated[idx] || []);
                            if (e.target.checked) {
                              current.add(option);
                            } else {
                              current.delete(option);
                            }
                            updated[idx] = Array.from(current);
                            setSelectedStyles(updated);
                          }}
                        />
                        {option}
                      </Label>
                    ))}
                    </ColumnGap>
                </div>
              </RowGap>

              {/* 참고 이미지 삭제 버튼 */}
              <CancelBtn onClick={() => removeImage(idx, item.filename)}>삭제</CancelBtn>
            </RefContent>
          ))}
        </div>
      )}
      </div>

      {/* 참고 이미지 추가 버튼 */}
      <BtnStartWrap>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={onImageUpload}
          style={{ display: "none" }}
        />
        <Btn onClick={()=> fileInputRef.current.click()}>참고이미지 추가하기</Btn>
      </BtnStartWrap>

      <ColumnGap>
        <TitleFont>
          추가 디자인 요구 사항
        </TitleFont>
        <TextArea 
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="추가 요구 사항을 입력하세요."
        />
      </ColumnGap>

      <BtnWrap>
        <Btn onClick={selectFrame}>선택된 Frame 저장</Btn>
        <Btn onClick={onAddress}>검증 진행하기</Btn>
        <CancelBtn onClick={onCancel}>취소하기</CancelBtn>
      </BtnWrap>
    </Content>
  );
}

export default App;
