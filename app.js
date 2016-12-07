var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pgp = require('pg-promise')();
var plotly = require('plotly')("rachelmikulecky", "hT96CjCPXdciDdg3zjZU")
var db = pgp('postgres://postgres:1@localhost:5432/sorting');
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.get('/', function(req,res,next){
  res.render('start');
});
app.post('/quiz', function(req,res,next){
  if(req.body.name){
    res.render('quiz');
  }
  else{
    res.redirect('/');
  }
});
app.post('/results', function(req,res,next){
  if(Object.keys(req.body).length === 22){
    setScores(function(){
      db.none('INSERT INTO scores (gryf, slyt, huff, rave) VALUES ($1, $2, $3, $4)',
      [score.gryf, score.slyt, score.huff, score.rave])
        .then(function () {
          db.many('SELECT * FROM scores')
            .then(function(rows){
              generateGraph(rows, function(url){
                res.render('results', {gryf:score.gryf, slyt:score.slyt, rave:score.rave, huff:score.huff, url:url});
              });
            })
            .catch(function (err){
              return next(err);
            })
        })
        .catch(function (err){
          return next(err);
        });
    }, res, req, next);
  }
});
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
  var graphOptions = {layout: layout, filename: "overlaid-histogram", fileopt: "overwrite"};
  plotly.plot(data, graphOptions, function (err, msg) {
      callback(msg.url);
  });
}
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
