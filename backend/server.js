
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// CORS 설정 (Figma 플러그인에서 접근 가능하게)
app.use(cors());

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

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
