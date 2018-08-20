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


// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })

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


var Schema=mongoose.Schema;

var userSchema = new Schema({
  _id: {
  'type': String,
  'default': shortid.generate
  },
  username : String,
  exercices :[{ type: Schema.Types.ObjectId, ref:'Exercice'}]
});
var User = mongoose.model('User', userSchema);

var exerciceSchema = new Schema({
  _id: {
    'type': String,
    'default': shortid.generate
    },
  user : { type: Schema.Types.ObjectId, ref:'User'},
  description : { type: String, required: true },
  duration:{ type: Number, required: true },
  date: Date,
});
var Exercice = mongoose.model('Exercice', exerciceSchema);

app.route('/api/exercise/new-user').post((req,res)=> {
    User.create({username:req.body.username},(err,data)=>{
      if (err) console.log(err);
      else res.json({"username":data.username,"_id":data._id})
    })
  })

app.route('/api/exercise/add').post((req,res)=> {
    User.findOne({_id:req.body.userId},(err,data)=>{
      if (err) console.log(err);
      else {
        console.log(mongoose.Types.ObjectId(req.body.userId))
        Exercice.create({user: req.body.userId,
                         description:req.body.description,
                         duration:req.body.duration,
                         date:req.body.date},(err,dat)=>{
          if (err) console.log(err);
          else {
            console.log(dat);
            res.json(dat)
          }
        })
      }
    })
  })