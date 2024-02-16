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
                    req.session.user = id;
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
        connection.query('INSERT INTO users VALUES (?, ?, ?, ?)', [id, hash, name,phone], function(error, results, fields) {
            if (error) {
                res.send('Error occurred during registration');
            } else {
                res.redirect('/login');
            }
        });
    });
});

app.get('/delivery', (req, res) => {
  connection.query('SELECT * FROM lost', (err, results) => {
    if (err) throw err;
    res.render('delivery', { projects: results });
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

app.post('/create', upload.single('image'), (req, res) => {
  const { title, location, context, request } = req.body;
  // multer에서 처리된 파일 이름 사용
  const imageFileName = req.file.filename; 
  const query = 'INSERT INTO lost (name, location, context, request, image, status) VALUES (?, ?, ?, ?, ?, ?)';
  
  connection.query(query, [title, location, context, request, imageFileName, 0], (err, results) => {
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
      const project = results[0];
      res.render('projectDetail', { project });
    });
  });

  app.get("/image/:imgName", function (req, res) {
    res.sendFile(__dirname + "/public/images/" + req.params.imgName);
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

