const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://online-study-ass-11.web.app',
    'https://online-study-ass-11.firebaseapp.com'
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());



app.get('/', (req, res) => {
  res.send('Online study running')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bcz5gxh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



// middlewares

const logger = async(req, res, next) =>{
  console.log('calledL:', req.hostname, req.originalUrl)
  next();
}


const verifyToken = async(req, res, next) =>{
  const token = req.cookies?.token;
  console.log('value of token', token)
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err)
    {
      return res.status(401).send({message: 'unauthorized'})
    }
    console.log('value in the token', decoded)
    req.user = decoded;
    next()
  })
  
}




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const assCollection = client.db('assDB').collection('task');

    const submitCollection = client.db('assDB').collection('submit');



    app.post('/jwt',   async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({ success: true })
    })


    // get all data
    app.get('/task',  async (req, res) => {
      const cursor = assCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    })



    // get data with id
    app.get('/task/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await assCollection.findOne(query);
      // console.log(result);
      res.setHeader('Content-difficultyLevel', 'application/json');
      res.send(result);
    });


    // send data to db

    app.post('/task', async (req, res) => {
      const task = req.body;
      console.log(task);
      const result = await assCollection.insertOne(task);
      console.log(result);
      res.send(result);
    })



    app.get('/submit',logger,verifyToken, async (req, res) => {
      const cursor = submitCollection.find();
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
    })


    app.post('/submit',logger, async (req, res) => {
      const submit = req.body;
      console.log(submit);
      const result = await submitCollection.insertOne(submit);
      console.log(result);
      res.send(result);
    })



    app.put('/task/:id',logger,verifyToken,async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedItem = req.body;

      const task = {
        $set: {

          description: updatedItem.description,
          title: updatedItem.title,
          marks: updatedItem.marks,
          difficultyLevel: updatedItem.difficultyLevel,
          startDate: updatedItem.startDate,
          dueDate: updatedItem.dueDate,
          img: updatedItem.img,
          status: updatedItem.status

        }
      }

      const result = await assCollection.updateOne(filter, task, options);
      console.log(result);
      res.send(result);
    })




    app.patch('/submit/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateSubmit = req.body;
      const updateDoc = {
        $set: {
          status: updateSubmit.status
        },
      };
      const result = await submitCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    app.delete('/task/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await assCollection.deleteOne(query);
      res.send(result);
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


















app.listen(port, () => {
  console.log(`Online is running on port ${port}`)
})