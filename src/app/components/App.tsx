import React, { useState, useEffect, useRef } from 'react';
import { dataURLtoBlob } from '../utils/dataURLtoBlob';

import ApiClient from '../utils/ApiClient';

import Result from './Result';

import '../styles/ui.css';

import { Btn, CancelBtn } from '../styles/Button'
import { Label } from '../styles/Label'
import { Content, RefContent, BtnWrap, BtnStartWrap, RowGap, ColumnGap, TextArea } from '../styles/Layout'
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

  // 스타일 추출
  const [extractedStyles, setExtractedStyles] = useState<any[]>([]);

  const styleOptions = ['색상', '폰트', '대조', '여백', '복잡도', '구조'] as const;
  type StyleOption = typeof styleOptions[number];


  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  const selectFrame = () => {
    parent.postMessage({ pluginMessage: { type: 'export-selected-frame' } }, '*'),
    parent.postMessage({ pluginMessage: { type: 'extract-css' } }, '*');
  };

  //참고 이미지 업로드
  const uploadToLocal = async (file: File, dataUrl: string) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await ApiClient.post('/upload/ref', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const result = res.data;
    console.log('Ref서버 응답:', result);

    setPreviewList((prev) => [...prev, { url: dataUrl, filename: result.filename }]);
    setSelectedStyles((prev) => [...prev, []]);
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
        // base64 → Blob 변환
        const blob = dataURLtoBlob(dataUrl);
        const file = new File([blob], filename, { type: 'image/png' });
  
        // 서버로 전송
        const formData = new FormData();
        formData.append('image', file);
  
        ApiClient.post('/upload/frame', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
          .then(res => {
            const result = res.data;
            setFrameImage({ url: dataUrl, filename: result.filename });
            console.log('Frame서버 응답:', result);
          });
      }
      if (msg?.type === 'extracted-css') {
        setExtractedStyles(msg.styles || []);
        console.log('추출된 스타일 저장됨:', msg.styles);
      }
    };
  }, []); //이미지 버튼 누르면 주소 출력되게

  // 참고 이미지 삭제 기능
  const removeImage = async (index: number, filename: string) => {
    try {
      await ApiClient.delete(`/upload/ref/${filename}`);
      console.log('서버에서 삭제됨:', filename);
    } catch (err) {
      console.error('삭제 실패:', err);
    }
    setPreviewList(prev => prev.filter((_, i) => i !== index));
    setSelectedStyles(prev => prev.filter((_, i) => i !== index));
  };
  
  const onAddress = async () => {
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
      const refImagesData = previewList.map((item, idx) => ({
        url: `/uploads/ref/${item.filename}`,
        styles: selectedStyles[idx] || []
      }));
      
      const frameImagesUrl = frameImage ? `/uploads/frame/${frameImage.filename}` : null;

      console.log(frameImagesUrl);

      const res = await ApiClient.post('/upload/address', {
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

  // 초기화(다시 시작)
  const resetAll = () => {
    setResultData(null);
    setPreviewList([]);
    setFrameImage(null);
    setSelectedStyles([]);
    setRequirements('');
  };

  if (resultData) {
    return <Result 
      data={resultData} 
      onBack={() => setResultData(null)} 
      onReset={resetAll} 
    />
  }

  return (
    <Content>
      <div>
        {isLoading && <LoadingModal isOpen={isLoading} />}
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
              <Btn onClick={() => removeImage(idx, item.filename)}>삭제하기</Btn>
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
