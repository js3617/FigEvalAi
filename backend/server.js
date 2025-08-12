
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { compareFrameWithRef } = require('./gptConfig'); // gptConfig.js에서 compareFrameWithRef 함수 가져오기

const PORT = process.env.PORT || 3001;
const URL = `http://localhost:${PORT}`;
const app = express();

// CORS 설정 (Figma 플러그인에서 접근 가능하게)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // 또는 필요에 따라 더 크게

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//uploads 디렉토리 없으면 생성
const uploadsBaseDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

// 사용자별 디렉토리 생성 함수
function ensureUserDirectories(userId) {
  const userDir = path.join(__dirname, 'uploads', userId);
  const refDir = path.join(userDir, 'ref');
  const frameDir = path.join(userDir, 'frame');
  
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  if (!fs.existsSync(refDir)) {
    fs.mkdirSync(refDir, { recursive: true });
  }
  if (!fs.existsSync(frameDir)) {
    fs.mkdirSync(frameDir, { recursive: true });
  }
  
  return { userDir, refDir, frameDir };
}

// multer 설정 - 임시 업로드 후 이동하는 방식으로 변경
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  },
});

const uploadRef = multer({ storage: tempStorage });
const uploadFrame = multer({ storage: tempStorage });

app.post('/upload/ref', uploadRef.single('image'), (req, res) => {
  try {
    const userNumber = req.body.userId || 'default';
    const userId = userNumber === 'default' ? 'default' : `PID_${userNumber}`;
    const { refDir } = ensureUserDirectories(userId);
    
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }
    
    const tempPath = req.file.path;
    const finalPath = path.join(refDir, req.file.filename);
    
    // 임시 파일을 최종 위치로 이동
    fs.renameSync(tempPath, finalPath);
    
    console.log(`참고 이미지 저장됨 (${userId}):`, req.file.filename);
    console.log(`파일 경로: ${finalPath}`);
    res.json({ filename: req.file.filename, userId });
  } catch (error) {
    console.error('참고 이미지 업로드 에러:', error);
    res.status(500).json({ error: '파일 업로드에 실패했습니다.', details: error.message });
  }
});

app.post('/upload/frame', uploadFrame.single('image'), (req, res) => {
  try {
    const userNumber = req.body.userId || 'default';
    const userId = userNumber === 'default' ? 'default' : `PID_${userNumber}`;
    const { frameDir } = ensureUserDirectories(userId);
    
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }
    
    const tempPath = req.file.path;
    const finalPath = path.join(frameDir, req.file.filename);
    
    // 임시 파일을 최종 위치로 이동
    fs.renameSync(tempPath, finalPath);
    
    console.log(`프레임 저장 (${userId}):`, req.file.filename);
    console.log(`파일 경로: ${finalPath}`);
    res.json({ filename: req.file.filename, userId });
  } catch (error) {
    console.error('프레임 업로드 에러:', error);
    res.status(500).json({ error: '파일 업로드에 실패했습니다.', details: error.message });
  }
});

app.delete('/upload/ref/:userId/:filename', (req, res) => {
  const { userId: userNumber, filename } = req.params;
  const userId = userNumber === 'default' ? 'default' : `PID_${userNumber}`;
  const filePath = path.join(__dirname, 'uploads', userId, 'ref', filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('파일 삭제 실패:', err);
      return res.status(500).send('파일 삭제 실패');
    }
    console.log(`파일 삭제 성공 (${userId}):`, filename);
    res.send('파일 삭제 성공');
  });
});

// Frame 이미지 삭제 엔드포인트
app.delete('/upload/frame/:userId/:filename', (req, res) => {
  const { userId: userNumber, filename } = req.params;
  const userId = userNumber === 'default' ? 'default' : `PID_${userNumber}`;
  const filePath = path.join(__dirname, 'uploads', userId, 'frame', filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Frame 파일 삭제 실패:', err);
      return res.status(500).send('Frame 파일 삭제 실패');
    }
    console.log(`Frame 파일 삭제 성공 (${userId}):`, filename);
    res.send('Frame 파일 삭제 성공');
  });
});

// 사용자별 모든 파일 정리 (개발용)
app.delete('/upload/cleanup/:userId', (req, res) => {
  const { userId: userNumber } = req.params;
  const userId = userNumber === 'default' ? 'default' : `PID_${userNumber}`;
  const userDir = path.join(__dirname, 'uploads', userId);
  
  if (!fs.existsSync(userDir)) {
    return res.json({ message: '해당 사용자 폴더가 존재하지 않습니다.' });
  }

  try {
    // 폴더와 내용물을 재귀적으로 삭제
    fs.rmSync(userDir, { recursive: true, force: true });
    console.log(`사용자 폴더 정리 완료: ${userId}`);
    res.json({ message: '사용자 폴더가 정리되었습니다.' });
  } catch (err) {
    console.error('폴더 정리 실패:', err);
    res.status(500).json({ error: '폴더 정리에 실패했습니다.' });
  }
});

app.post("/upload/address", async (req, res) => {
  const { userId: userNumber, refImages, frameImage, requirements, extractedStyles } = req.body;
  const userId = userNumber === 'default' ? 'default' : `PID_${userNumber}`;

  console.log('=== GPT 비교 요청 시작 ===');
  console.log('사용자 번호:', userNumber);
  console.log('사용자 ID:', userId);
  console.log('참고 이미지 개수:', refImages?.length);
  console.log('Frame 이미지 경로:', frameImage);

  if (!userNumber) {
    console.log('에러: 사용자 번호가 없음');
    return res.status(400).json({ error: '사용자 번호가 필요합니다.' });
  }

  const frameFileName = path.basename(frameImage);
  const framePath = path.join(__dirname, 'uploads', userId, 'frame', frameFileName);
  const frameExists = fs.existsSync(framePath);

  console.log('Frame 파일명:', frameFileName);
  console.log('Frame 파일 경로:', framePath);
  console.log('Frame 파일 존재 여부:', frameExists);

  if (!frameExists) {
    console.log('에러: Frame 파일이 존재하지 않음');
    return res.status(400).json({ 
      error: 'frameImage 파일이 존재하지 않습니다.',
      details: {
        frameFileName,
        framePath,
        userId
      }
    });
  }

  const refResults = [];

  for (const item of refImages) {
    const refFileName = path.basename(item.url);
    const refPath = path.join(__dirname, 'uploads', userId, 'ref', refFileName);
    const exists = fs.existsSync(refPath);
    const styles = Array.isArray(item.styles) ? item.styles : [];

    if (!exists) {
      refResults.push({
        fileName: refFileName,
        exists: false,
        gptResult: '이미지 없음'
      });
      continue;
    }

    try {
      const gptResult = await compareFrameWithRef(frameFileName, refFileName, styles, requirements, extractedStyles, userId);
      refResults.push({
        fileName: refFileName,
        exists: true,
        styles,
        gptResult
      });
    } catch (err) {
      console.error(`GPT 비교 실패 (${refFileName}):`, err.message);
      refResults.push({
        fileName: refFileName,
        exists: true,
        styles,
        gptResult: 'GPT 응답 실패'
      });
    }
  }

  res.json({
    frameResult: {
      fileName: frameFileName,
      exists: true
    },
    refResults,
    requirements,
    frameStyles: extractedStyles,
  });
});



app.listen(PORT, () => {
  console.log(`서버 실행 중: ${URL}`);
});
