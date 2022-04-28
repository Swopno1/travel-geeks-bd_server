const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorize Access!' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access!' });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oiekl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('travelGeeks').collection('services');
    const orderCollection = client.db('travelGeeks').collection('order');

    // AUTH
    app.post('/signin', async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      });

      res.send({ accessToken });
    });

    // Services API

    // Service Collection API
    // GET: See Services List
    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();

      res.send(services);
    });

    // Get Single Service
    app.get('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const service = await serviceCollection.findOne(query);

      res.send(service);
    });

    // POST: Add new Service
    app.post('/service', async (req, res) => {
      const newService = req.body;

      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    // DELETE: Delete item
    app.delete('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);

      res.send(result);
    });

    // Order collection API

    // GET: Get orders data
    app.get('/order', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;

      if (decodedEmail === email) {
        const query = { email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();

        res.send(orders);
      } else {
        res.status(403).send({ message: 'Forbidden Access!' });
      }
    });

    // POST: Add/post a new order
    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);

      res.send(result);
    });
  } finally {
    // console.log('Completed');
  }
}

run().catch(console.dir);

// Root API
app.get('/', (req, res) => {
  res.send('Hello Travel Geeks Bd');
});

app.listen(port, () => {
  console.log(`Server running at port: ${port}`);
});
