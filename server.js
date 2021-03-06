const express = require('express')
const app = express()
const bodyParser = require('body-parser')
var shortid = require('shortid');

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// my code below
var Schema=mongoose.Schema;

var userSchema = new Schema({
  username : String,
});
var User = mongoose.model('User', userSchema);

var exerciceSchema = new Schema({
  user : { type: Schema.Types.ObjectId, ref:'User'},
  description : { type: String, required: true },
  duration:{ type: Number, required: true },
  date: String,
});
var Exercice = mongoose.model('Exercice', exerciceSchema);

app.route('/api/exercise/new-user').post((req,res)=> {
    User.create({username:req.body.username},(err,data)=>{
      if (err) res.send(err);
      else res.json({"username":data.username,"_id":data._id})
    })
  })

app.route('/api/exercise/add').post((req,res)=> {
//   we get the user
    User.findOne({_id:req.body.userId},(err,data)=>{
      if (err) res.send(err);
      else {
//         then create a new exercise
        Exercice.create({user: req.body.userId,
                         description:req.body.description,
                         duration:req.body.duration,
                         date:new Date(req.body.date).toDateString()},(err,dat)=>{
          if (err) res.send(err);
//           then send it
          else res.json({
                "username":data.username,
                "description":dat.description,
                "duration":dat.duration,
                "_id":dat.user,
                "date":dat.date
              })
        })
      }
    })
  })

app.route('/api/exercise/log').get((req,res)=>{
//   we look for the user's id and create an object to query the database
  User.findOne({_id:req.query.userId}).exec((err, dat)=>{
    if (err) res.send(err);
    else {
      var query={
        "user":req.query.userId,
      }
//       handles the from and to request to the query object
      if (req.query.from && req.query.to){
        query.date={"$gte":req.query.from,"$lte":req.query.to}
      } else if(req.query.from){
        query.date={"$gte":req.query.from}
      } else if (req.query.to){
        query.date={"$lte":req.query.to}
      }
//       handles the limit to the query
//       queries the database and returns the result
      Exercice.find(query).limit(parseInt(req.query.limit)).select('-_id -user -__v')
        .exec((err,data)=>{
          if (err) res.send(err);
          else {
            console.log(User.findById(req.query.userId).exec())
            res.json({
              "_id":req.query.userId,
              "username":dat.username,
              "count":data.length,
              "log":data
            });
          }
        })
    }
  })
})