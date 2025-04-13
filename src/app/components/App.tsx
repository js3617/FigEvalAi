import React from 'react';
import logo from '../assets/logo.svg';
import '../styles/ui.css';

function App() {
  const textbox = React.useRef<HTMLInputElement>(undefined);

  const countRef = React.useCallback((element: HTMLInputElement) => {
    if (element) element.value = '5';
    textbox.current = element;
  }, []);

  const onCreate = () => {
    const count = parseInt(textbox.current.value, 10);
    parent.postMessage({ pluginMessage: { type: 'create-rectangles', count } }, '*');
  };

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
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
    <div>
      <img src={logo} />
      <h2>Rectangle Creator</h2>
      <p>
        Count: <input ref={countRef} />
      </p>
      <div>
        <p>
          Upload Image: <input type="file" accept="image/*" onChange={onImageUpload} />
        </p>
      </div>
      <button id="create" onClick={onCreate}>
        Create
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default App;
