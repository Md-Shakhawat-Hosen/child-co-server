const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');





//middleware

const corsOptions = {
  // origin: '*',
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://child-co-client.web.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
// const corsOptions = {
//   // origin: '*',
//   origin: ["https://child-co-client.web.app"],
//   credentials: true,
//   optionSuccessStatus: 200,
// };

app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   next();
// });


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS_KEY}@cluster0.c3eejtp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviceCollection = client.db("ChildCoDB").collection("services");
    const bookingCollection = client.db("ChildCoDB").collection("booking");



    //jwt


    const  verifyToken = (req,res,next)=>{
      const token = req.cookie?.token;
     
      if(!token){
        return res.status(401).send({message:'unauthorized access'})
      }

      jwt.verify(token, process.env.SECRET_TOKEN,(err,decoded)=>{
        if(err) {
        
          return res.status(401).send({message: 'unauthorized'})
        }
        req.user = decoded;
        next();
      })
    }

    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.SECRET_TOKEN,{expiresIn: '1h'});
      // res
      // .cookie('token', token, {
      //   httpOnly: true,
      //   secure: false,
      //   // sameSite: 'none'
      // })
      // .send({success:true})
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    })




    app.get('/logout', async(req,res)=>{
      
      res.clearCookie('token',{maxAge:0})
      .send({success:true})
    })

    //post services

    app.post("/services", async (req, res) => {
      try {
        const service = req.body;
        const result = await serviceCollection.insertOne(service);
        res.send(result);
      } catch (error) {
        console.log(error.message)
      }
    });

    app.put("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updateService = req.body;
        const filter = { _id: new ObjectId(id) };
        const option = { upsert: true };
         const addService = {
           serviceImage,
           serviceName,
           serviceDescription,

           serviceProvider,
           servicePrice,
           serviceArea,
         } = updateService;

        const updatedService = {
          $set:{
            ...addService
          }
        }
        
        const result = await serviceCollection.updateOne(filter,updatedService,option)

        // console.log(result)
        res.send(result)

      } catch (error) {
        console.log(error.message);
      }
    });


    app.delete('/services/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};

      const result = await serviceCollection.deleteOne(query);
      console.log(result)
      res.send(result);
    })

    app.get("/services",async (req, res) => {
      try {
        // const cursor = serviceCollection.find();
        // const result = await cursor.toArray();
        // res.send(result);

        //  console.log(req.query);

        let query = {};
        if (req.query?.email) {
          query = { "serviceProvider.email": req.query.email };
          const result = await serviceCollection.find(query).toArray();
          res.send(result);
        } else {
          const cursor = serviceCollection.find();
          const result = await cursor.toArray();
          res.send(result);
        }

        // console.log(result)

        //  res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // Booking

    app.post("/booking", async (req, res) => {
      const book = req.body;
      const result = await bookingCollection.insertOne(book);
      res.send(result);
    });


    app.get("/booking", async (req, res) => {
      try {

        

        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
          const result = await bookingCollection.find(query).toArray();
          res.send(result);
        } else {
          const cursor = bookingCollection.find();
          const result = await cursor.toArray();
          res.send(result);
        }

    
      } catch (error) {
        console.log(error.message);
      }
    });


    app.patch('/booking/:id', async(req,res)=>{
      const user = req.body;

      const id = req.params.id;
      console.log(id);

      console.log(user)
      const filter = {_id: new ObjectId(id)};


      // const filter = { serviceProviderEmail: user.email };
      // console.log(filter)
      const updateDoc = {
        $set:{
          status: user.status
        }
      }
      const result = await bookingCollection.updateOne(filter,updateDoc);


      res.send(result)
      
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("child co server is running");
});

app.listen(port, () => {
  console.log(`child co server is running on port:${port}`);
});
