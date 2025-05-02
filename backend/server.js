
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const URL = 'http://localhost:3000';
const app = express();

// CORS 설정 (Figma 플러그인에서 접근 가능하게)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // 또는 필요에 따라 더 크게

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//uploads 디렉토리 없으면 생성
const uploadDir = path.join(__dirname, 'uploads/ref');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const frameDir = path.join(__dirname, 'uploads/frame');
if (!fs.existsSync(frameDir)) {
  fs.mkdirSync(frameDir, { recursive: true });
}

// multer 설정
const refStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ref/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname;
    // const unique = file.originalname;
    cb(null, unique);
  },
});
const uploadRef = multer({ storage: refStorage });

const frameStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/frame/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname;
    // const unique = file.originalname;
    cb(null, unique);
  },
});
const uploadFrame = multer({ storage: frameStorage });

app.post('/upload/ref', uploadRef.single('image'), (req, res) => {
  console.log('이미지 저장됨:', req.file.filename);
  res.json({ filename: req.file.filename });
});

app.post('/upload/frame', uploadFrame.single('image'), (req, res) => {
  console.log('프레임 저장:', req.file.filename);
  res.json({ filename: req.file.filename});
});

app.delete('/upload/ref/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('파일 삭제 실패:', err);
      return res.status(500).send('파일 삭제 실패');
    }
    console.log('파일 삭제 성공:', filename);
    res.send('파일 삭제 성공');
  });
});

app.post("/upload/address", (req, res) => {
  const { refImages, frameImage, requirements } = req.body;

  console.log("refImages:", refImages);
  console.log("frameImage:", frameImage);
  console.log("requirements:", requirements);

  const refResults = refImages.map((item, idx) => {
    const fileName = path.basename(item.url);
    const filePath = path.join(__dirname, 'uploads/ref', fileName);
    const exists = fs.existsSync(filePath);

    const styles = Array.isArray(item.styles) ? item.styles : [];

    console.log(`${idx + 1}. ${fileName} => 존재: ${exists}`);
    console.log(`선택된 스타일 요소: ${styles.join(', ')}`);

    return { fileName, exists, styles };
  });
  
  const frameFileName = path.basename(frameImage);
  console.log(frameFileName);
  const frameFilePath = path.join(__dirname, 'uploads/frame', frameFileName);
  console.log(frameFilePath);
  const frameExists = fs.existsSync(frameFilePath);
  console.log(frameExists);
  console.log(`${frameFileName} => 존재: ${frameExists}`);

  res.json({
    refResults,
    frameResult: {
      fileName: frameFileName,
      exists: frameExists,
    },
    requirements
  });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: ${URL}:${PORT}`);
});
