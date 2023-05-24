const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use('/public', express.static('public'));

app.set('view engine', 'ejs'); //ejs 다운받고 등록을 해줘야함
var db;
MongoClient.connect('mongodb+srv://tjwns3481:A8XimCFYfbd32CIN@cluster0.xhbgi3b.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true }, function(error, client){
  if (error) return console.log(error)
  db = client.db('todoapp');
  
  app.listen(8080, function () {
    console.log('listening on 8080')
  });
})

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
  res.render('index.ejs')
})

app.get('/write', (req, res, next) => {
  res.render('write.ejs')
})

app.post('/add', (req, res, next) => {
  db.collection('counter').findOne({ name: '게시물갯수' },function (error, result) {
    var totalPost = result.totalPost;

    db.collection('post').insertOne({ _id: totalPost + 1, title: req.body.title, date: req.body.date }, function (error, postResult) {
      db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (error, result) {
        if (error) console.error;
      });
    });
  });
  res.render('index.ejs')
});

app.get('/list', (req, res, next) => {
  db.collection('post').find().toArray(function (error, result) {
    res.render('list.ejs', { posts: result });
  });

  app.delete('/delete', (req, res, next) => {
    req.body._id = parseInt(req.body._id)
    db.collection('post').deleteOne(req.body, function (error, result) {
      if (error) console.error;
      console.log('삭제완료');
      res.status(200).send({ message: '성공했습니다' });
    })
  })
})

  // /detail로 접속하면 detail.ejs 보여줌

app.get('/detail/:id', (req, res, next) => {
  db.collection('post').findOne({_id : parseInt(req.params.id)}, function (error, result) {
    console.log(result);
    res.render('detail.ejs', { data: result });
  })
})

app.get('/detail/:id/edit', (req, res, next) => {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
    if (error) console.error;
    console.log(result);
    res.render('edit.ejs', { data: result });
  })
})

app.put('/edit', (req, res, next) => {
  db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, date: req.body.date } }, function (error, result) {
    if (error) console.error;
    console.log('수정완료');
    res.redirect('/list');
  })
})

// 회원기능
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// 세션회원기능
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (req, res, next) => {
  res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail'
}), (req, res, next) => {
  res.redirect('/');
})

app.get('/mypage', isLogined, function(req, res) {
  console.log(req.user);
  res.render('mypage.ejs', {user : req.user});
})

function isLogined(req, res, next) {
  if (req.user) {
    next()
  } else {
    res.send('로그인 안하셨는데요?');
  }
}


passport.use(new LocalStrategy({
  usernameField: 'id', // form 태그 name 정의하는 부분
  passwordField: 'pw', // form 태그 name 정의하는 부분
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) {
    if (error) return done(error)

    if (!result) return done(null, false, { message: '존재하지않는 아이디요' });
    if (입력한비번 == result.pw) {
      return done(null, result)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));


passport.serializeUser(function (user,done) {
  done(null, user.id)
});

passport.deserializeUser(function (id, done) {
  db.collection('login').findOne({ id }, function (error, result) {
    done(null, result);
  })
});