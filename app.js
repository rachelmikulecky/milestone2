var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pgp = require('pg-promise')();
var db = pgp('postgres://postgres:1@localhost:5432/sorting');
var name;
// this is to serve the css and js from the public folder to your app
// it's a little magical, but essentially you put files in there and link
// to them in you head of your files with css/styles.css
app.use(express.static(__dirname + '/public'));
// this is setting the template engine to use ejs
app.set('view engine', 'ejs');
// setting your view folder
app.set('views', __dirname+'/views');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
// for your routes to know where to know if there is param _method DELETE
// it will change the req.method to DELETE and know where to go by setting
// your req.url path to the regular path without the parameters
// gettting all the posts
app.get('/', function(req,res,next){
  res.render('start');
});
// edit posts
app.post('/quiz', function(req,res,next){
  if(req.body.name){
    name = req.body.name;
    res.render('quiz');
  }
  else{
    res.redirect('/');
  }
});
app.post('/results', function(req,res,next){
  if(Object.keys(req.body).length === 22){
    score = {gryf:0, slyt:0, rave:0, huff:0};
    for(var i = 0; i < 22; ++i){
      var question = "question" + i;
      var answer = req.body[question];
      db.one('select * from hat where answer = $1', answer)
        .then(function (weights) {
          score.gryf += weights.gryf;
          score.slyt += weights.slyt;
          score.rave += weights.rave;
          score.huff += weights.huff;
        })
        .catch(function (err) {
          return next(err);
        });
    }
    db.none('INSERT INTO scores (gryf, slyt, huff, rave) VALUES ($1, $2, $3, $4)', [score.gryf, score.slyt, score.rave, score.huff])
      .then(function () {
        res.render('results', {gryf:score.gryf, slyt:score.slyt, rave:score.rave, huff:score.huff});
      });
  }
});
app.listen(3000, function(){
  console.log('Application running on localhost on port 3000');
});
