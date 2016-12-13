var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pgp = require('pg-promise')();
var db = pgp('postgres://postgres:1@localhost:5432/sorting');
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
//Load ejs.start
app.get('/', function(req,res,next){
  res.render('start');
});
//As long as they entered something, load quiz.ejs
app.post('/quiz', function(req,res,next){
  if(req.body.name){
    res.render('quiz');
  }
  else{
    res.redirect('/');
  }
});
//Make sure they answered every question
//Then determine their scores and enter them into the DATABASE
//Load results.ejs with their scores
app.post('/results', function(req,res,next){
  if(Object.keys(req.body).length === 22){
    setScores(function(){
      db.none('INSERT INTO scores (gryf, slyt, huff, rave) VALUES ($1, $2, $3, $4)',
      [score.gryf, score.slyt, score.huff, score.rave])
        .then(function () {
          res.render('results', {gryf:score.gryf, slyt:score.slyt, rave:score.rave, huff:score.huff});
        })
        .catch(function (err){
          return next(err);
        });
    }, res, req, next);
  }
});
//Get all of the scores and generate the objects needed to create the graph
//Send those two objects to graph.ejs
app.get('/graph', function(req,res,next){
  db.many('SELECT * FROM scores')
    .then(function(rows){
      generateGraph(rows, function(data, layout){
        res.render('graph', {data:data, layout:layout});
      });
    })
    .catch(function (err){
      return next(err);
    })
});
//Using plotly.js's template start creating the data and layout needed to make
//a histogram
function generateGraph(rows, callback){
  var gryf = [];
  var slyt = [];
  var rave = [];
  var huff = [];
  for (var i = 0; i < Object.keys(rows).length; i ++) {
  	gryf[i] = rows[i].gryf;
  	slyt[i] = rows[i].slyt;
    rave[i] = rows[i].rave;
    huff[i] = rows[i].huff;
  }
  var Gryffindor = {
    name: "Gryffindor",
    x: gryf,
    opacity: 0.75,
    type: "histogram"
  };
  var Slytherin = {
    name: "Slytherin",
    x: slyt,
    opacity: 0.75,
    type: "histogram"
  };
  var Hufflepuff = {
    name: "Hufflepuff",
    x: huff,
    opacity: 0.75,
    type: "histogram"
  };
  var Ravenclaw = {
    name: "Ravenclaw",
    x: rave,
    opacity: 0.75,
    type: "histogram"
  };
  var data = [Ravenclaw, Hufflepuff, Slytherin, Gryffindor];
  var layout = {title: "House Distribution Graph", barmode: "overlay", xaxis: {title: "Scores"}};
  callback(data, layout);
}
//Determine the 4 scores by finding the answer in the database and adding the
//values found there to the current total
function setScores(callback, res, req, next){
  score = {gryf:0, slyt:0, rave:0, huff:0};
  count = 0;
  for(var i = 0; i < 22; ++i){
    var question = "question" + i;
    var answer = req.body[question];
    db.one('select * from hat where answer = $1', answer)
      .then(function (weights) {
          ++count;
          score.gryf += weights.gryf;
          score.slyt += weights.slyt;
          score.rave += weights.rave;
          score.huff += weights.huff;
          if(count === 22) callback();
      })
      .catch(function (err) {
        return next(err);
      });
  }
}
app.listen(3000, function(){
  console.log('Application running on localhost on port 3000');
});
