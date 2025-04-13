import React, { useState } from 'react';
import '../styles/ui.css';

function App() {

  const [previewList, setPreviewList] = useState<string[]>([]); //미리 보기 저장

  const uploadToLocal = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    console.log('서버 응답:', result);
  };

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;

        setPreviewList((prev) => [...prev, dataUrl]);
        
      parent.postMessage(
        {
          pluginMessage: {
            type: 'insert-image',
            dataUrl,
          },
        },
        '*'
      );
      uploadToLocal(file);
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
};  

  React.useEffect(() => {
    // This is how we read messages sent from the plugin controller
    window.onmessage = (event) => {
      const { type, message } = event.data.pluginMessage;
      if (type === 'create-rectangles') {
        console.log(`Figma Says: ${message}`);
      }
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div>
        {previewList.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {previewList.map((url, idx) => (
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
                src={url}
                alt={`preview-${idx}`}
                style={{
                  maxWidth: '100%',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                }}
              />
            </div>
          ))}
        </div>
      )}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onImageUpload}
      />

      <button onClick={onCancel} style={{ marginTop: '20px', cursor: "pointer" }}>
        취소하기
      </button>
    </div>
  );
}

export default App;
