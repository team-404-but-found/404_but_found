const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const { exec } = require('child_process');
let multer = require('multer');

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/images');
  },
  filename: function(req, file, cb) {
    // 파일 이름에 타임스탬프 추가
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, filename);
  }
});

var upload = multer({ storage: storage });
// Database connection
const connection = mysql.createConnection({
    host: 'dongha.xyz',
    user: 'gachon',
    password: 'gachon',
    database: 'gachon'
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected to MySQL Database!");
});

const app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    if (req.session.user) {
        res.render('index');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { id, password } = req.body;
    connection.query('SELECT * FROM users WHERE id = ?', [id], function(error, results, fields) {
        if (results.length > 0) {
            bcrypt.compare(password, results[0].password, function(err, result) {
                if (result == true) {
                    req.session.user = results[0].uid;
                    res.redirect('/');
                } else {
                    res.send('Incorrect password');
                }
            });
        } else {
            res.send('User not found');
        }
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { id, password, name, phone } = req.body;
    bcrypt.hash(password, 10, function(err, hash) {
        connection.query('INSERT INTO users (id,password,name,phone_number) VALUES (?, ?, ?, ?)', [id, hash, name,phone], function(error, results, fields) {
            if (error) {
                res.send('Error occurred during registration');
            } else {
                res.redirect('/login');
            }
        });
    });
});

app.get('/delivery', (req, res) => {
  connection.query('SELECT * FROM lost where status != 2', (err, results) => {
    if (err) throw err;
    res.render('delivery', { projects: results });
  });
});

app.get('/game', (req, res) => {
  connection.query('SELECT * FROM proposer', (err, results) => {
    if (err) throw err;
    res.render('game', { projects: results });
  });
});

app.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  const query = 'SELECT * FROM lost WHERE name LIKE ?';
  connection.query(query, [`%${keyword}%`], (err, results) => {
    if (err) throw err;
    res.render('delivery', { projects: results });
  });
});


app.get('/lost_create', (req, res) => {
  res.render('lost_create');
});

app.get('/game_create', (req, res) => {
  res.render('game_create');
});


app.post('/create', upload.single('image'), (req, res) => {
  const { title, location, context, request } = req.body;
  // multer에서 처리된 파일 이름 사용
  const imageFileName = req.file.filename; 
  const query = 'INSERT INTO lost (name, location, context, request, image, status, author) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  connection.query(query, [title, location, context, request, imageFileName, 0, req.session.user], (err, results) => {
    if (err) throw err;
    res.redirect('/');
  });
});

app.post('/game_make', upload.single('image'), (req, res) => {
  const { title, context, selected_image } = req.body;
  // multer에서 처리된 파일 이름 사용
  const imageFileName = req.file.filename; 
  const query = 'INSERT INTO proposer (name, context, image, RSP, status) VALUES (?, ?, ?, ?, ?)';
  
  connection.query(query, [title, context, imageFileName, selected_image, 0], (err, results) => {
    if (err) throw err;
    res.redirect('/');
  });
});

app.get('/project', (req, res) => {
    const projectId = req.query.id;
    connection.query('SELECT * FROM lost WHERE no = ?', [projectId], (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.status(404).send('Project not found');
      }
      const project = results[0]

      connection.query('SELECT * FROM maybe_found WHERE lid = ?', [projectId], (err, results) => {
        if (err) throw err;
        const messages = results;
        if (messages == undefined) {
          messages = [];
        }
        connection.query('SELECT phone_number FROM users WHERE uid = ?', [project.author], (err, results) => {
          if (err) throw err;
          const phone_number = results[0];
          
          const is_author = req.session.user==project.author;
  
          console.log("현재 ID : " + req.session.user);
          console.log("작성자 ID : " + project.author);
          console.log("같나요? : " + is_author);
  
          res.render('projectDetail', { project, is_author, messages, phone_number });
        });
      });
      
      
      
    });
  });

  app.post('/lost_post', (req, res) => {
    // 요청 본문에서 데이터 추출
    const { id, mode, message } = req.body;
    
    if (mode == "found") {
      const query = 'UPDATE `lost` SET `status` = 2 WHERE `no` = ?;';
  
      connection.query(query, [id], (err, results) => {
        if (err) throw err;
        res.redirect('/');
      });
    } else if (mode == "maybefound") {
      const query2 = 'INSERT INTO maybe_found (lid, uid, message) VALUES (?, ?, ?);';
  
      const intid = parseInt(id)
      const userName = parseInt(req.session.user);
      // console.log(intid, userName, message);
      // console.log(typeof(intid), typeof(userName), typeof(message));
      connection.query(query2, [intid, userName, message], (err, results) => {
        if (err) throw err;
        // res.redirect('/');
      });

      // UPDATE `lost` SET `status` = 1 WHERE `no` = 5;
      const query3 = 'UPDATE `lost` SET `status` = 1 WHERE `no` = ?;';
  
      connection.query(query3, [id], (err, results) => {
        if (err) throw err;
        res.redirect('/');
      });
    }
    
    
  });


  app.get("/image/:imgName", function (req, res) {
    res.sendFile(__dirname + "/public/images/" + req.params.imgName);
  });

  app.get('/game_detail', (req, res) => {
    const gameId = req.query.id;
    connection.query('SELECT * FROM proposer WHERE no = ?', [gameId], (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.status(404).send('Project not found');
      }
      const project = results[0];
      res.render('gameDetail', { project });
    });
  });


  app.get('/profile', (req, res) => {
    const projectId = req.query.id;
  
    connection.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, projectResults) => {
      if (err) throw err;
  
      if (projectResults.length === 0) {
        return res.status(404).send('Project not found');
      }
  
      const project = projectResults[0];
  
      connection.query('SELECT * FROM ProjectApplications WHERE projectId = ?', [projectId], (err, applicationResults) => {
        if (err) throw err;
  
        const applications = {
          pending: [],
          accepted: []
        };
  
        applicationResults.forEach(application => {
          if (application.acc === 1) {
            applications.accepted.push(application);
          } else {
            applications.pending.push(application);
          }
        });
  
        res.render('profileDetail', { project, applications });
      });
    });
  });
  
  app.post('/game_result', (req, res) => {
    const { id, selected_image } = req.body;
    // multer에서 처리된 파일 이름 사용
    
    const query = 'INSERT INTO challenger  (RSP, proposer_no) VALUES (?, ?)';
    
    connection.query(query, [selected_image, id], (err, results) => {
      if (err) throw err;
      connection.query(`SELECT proposer.no ,proposer.RSP as proRSP, status, challenger.RSP as challRSP
      FROM proposer INNER JOIN challenger ON proposer.no = challenger.proposer_no;`, (err2, results2) => {
        if (err2) throw err;
        const project = results2[0];
        res.render('gameend', { project });
      });
    });
  });
  app.get('/logout', (req, res) => {
    // 세션 파괴
    req.session.destroy((err) => {
        if(err) {
            console.log(err);
            res.send('로그아웃 중 오류가 발생했습니다.');
        } else {
            // 로그아웃 성공 후 로그인 페이지로 리다이렉트
            res.redirect('/login');
        }
    });
});

  app.post('/apply', (req, res) => {
    const application = {
      userID: req.session.user,
      projectId: req.body.id,
      answerQA: req.body.answerQA,
      answerQB: req.body.answerQB
    };
  
    const query = 'INSERT INTO ProjectApplications SET ?';
    connection.query(query, application, (err, result) => {
      if (err) {
        throw err;
      }
      console.log('Application saved:', result);
      res.redirect('/');
    });
  });
  app.post('/accept', (req, res) => {
    const applicationID = req.body.applicationID;
  
    connection.query('UPDATE ProjectApplications SET acc = 1 WHERE applicationID = ?', [applicationID], (err, result) => {
      
  
      // Redirect back to the profile page after updating
      res.redirect('back');
      //res.redirect('/profile?id=' + req.body.id);
    });
  });
  app.get('/pro', (req, res) => {
    const userID = req.query.id;
  
    connection.query('SELECT * FROM ProjectApplications WHERE userID = ?', [userID], (err, applicationResults) => {
      if (err) throw err;
  
      res.render('pro', { applications: applicationResults });
    });
  });
  
  
app.listen(999, () => console.log('Server running on port 999'));

