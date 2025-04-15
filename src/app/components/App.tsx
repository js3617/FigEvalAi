import React, { useState, useEffect, useRef } from 'react';
import { dataURLtoBlob } from '../utils/dataURLtoBlob';

import '../styles/ui.css';

import { Btn } from '../styles/Button'
import { BtnWrap, BtnStartWrap } from '../styles/Layout'

function App() {

  const [previewList, setPreviewList] = useState<{ url: string; filename: string }[]>([]); //미리 보기 저장
  
  const fileInputRef = useRef(null); // 파일 입력 참조

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  const selectFrame = () => {
    parent.postMessage({ pluginMessage: { type: 'export-selected-frame' } }, '*');
  };

  //참고 이미지 업로드
  const uploadToLocal = async (file: File, dataUrl: string) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('http://localhost:3000/upload/ref', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    console.log('서버 응답:', result);

    setPreviewList((prev) => [...prev, { url: dataUrl, filename: result.filename }]);
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
  
        fetch('http://localhost:3000/upload/frame', {
          method: 'POST',
          body: formData,
        })
          .then(res => res.json())
          .then(result => {
            console.log('서버 응답:', result);
          });
      }
    };
  }, []);

  // 참고 이미지 삭제 기능
  const removeImage = async (index: number, filename: string) => {
    try {
      await fetch(`http://localhost:3000/upload/ref/${filename}`, {
        method: 'DELETE',
      });
      console.log('서버에서 삭제됨:', filename);
    } catch (err) {
      console.error('삭제 실패:', err);
    }
  
    setPreviewList(prev => prev.filter((_, i) => i !== index));
  };
  

  return (
    <div style={{ padding: 20 }}>
      <div>
        {previewList.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {previewList.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'start',
              }}
            >
              <span style={{ fontWeight: 'bold', marginBottom: 4 }}>
                참고이미지 {idx + 1}
              </span>
              <img
                src={item.url}
                alt={`preview-${idx}`}
                style={{
                  maxWidth: '100%',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                }}
              />
            <Btn onClick={() => removeImage(idx, item.filename)}>삭제하기</Btn>
            </div>
          ))}
        </div>
      )}
      </div>

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
      <textarea/>
      <BtnWrap>
        <Btn onClick={selectFrame}>선택된 Frame 저장</Btn>
        <Btn onClick={onCancel}>취소하기</Btn>
      </BtnWrap>
    </div>
  );
}

export default App;
