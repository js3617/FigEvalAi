//server에 전송할 수 있는 파일 형태로 변경
export function dataURLtoBlob(dataUrl : string) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1]; //MIME 타입 출력(image/png)
    const bstr = atob(arr[1]); //디코딩
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) 
        u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], {type: mime});
}