const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000

app.get('/', (req, res) => {
    res.send('Welcome to Electro Shop Server')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@database.1n8y8.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const productCollection = client.db(`${process.env.DB_NAME}`).collection("products");
    productCollection.createIndex({ productName: "text" });
    const orderCollection = client.db(`${process.env.DB_NAME}`).collection("Orders");

    app.get('/products', (req, res) => {
        productCollection.find({})
            .toArray((err, docs) => res.send(docs))
    })

    app.get('/search', (req, res) => {
        if (!req.query.keyword) {
            return productCollection.find({})
                .toArray((err, docs) => res.send(docs))
        }
        productCollection.find({ $text: { $search: req.query.keyword } })
            .toArray((err, docs) => res.send(docs))
    })

    app.get('/orders', (req, res) => {
        const queryEmail = req.query.email;
        orderCollection.find({ email: queryEmail })
            .toArray((err, docs) => res.send(docs))
    })

    app.post('/addProduct', (req, res) => {
        productCollection.insertOne(req.body)
            .then(result => res.send(!!result.insertedCount))
    })

    app.post('/addOrder', (req, res) => {
        const order = req.body;
        orderCollection.insertOne(order)
            .then(result => res.send(!!result.insertedCount))
    })

    app.delete('/delete/:id', (req, res) => {
        productCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                res.send(!!result.deletedCount)
            })
    })

    app.patch('/update/:id', (req, res) => {
        productCollection.updateOne(
            { _id: ObjectId(req.params.id) },
            {
                $set: req.body
            }
        ).then(result => {
            res.send(result.modifiedCount > 0)
        })
    })
});


app.listen(port);