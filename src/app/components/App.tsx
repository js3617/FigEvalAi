import React, { useState } from 'react';
import '../styles/ui.css';

function App() {

  const [previewList, setPreviewList] = useState<string[]>([]); //미리 보기 저장

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
        <p>
          Upload Images:{' '}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onImageUpload}
          />
        </p>

        {previewList.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {previewList.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`preview-${idx}`}
                style={{
                  maxWidth: '100%',
                  marginBottom: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <button onClick={onCancel} style={{ marginTop: '20px' }}>
        Cancel
      </button>
    </div>
  );
}

export default App;
