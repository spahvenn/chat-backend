const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
// Using mongo-mock for easier development and run setup
const mongodb = require('mongo-mock');
const MongoClient = mongodb.MongoClient;
const url = 'mongodb://localhost:27017/chat-backend';

let db;

MongoClient.connect(url)
  .then(database => {
    db = database;
    const collection = db.collection('messages');
    // User connects
    io.on('connection', socket => {
      // User sends chat message
      socket.on('chat message', async msg => {
        let insertMessageResult;
        try {
          insertMessageResult = await collection.insertOne({
            message: msg.message,
            timestamp: new Date(),
            username: msg.username
          });
        } catch (err) {
          console.log(err);
        }
        // Send new message to all users
        io.emit('chat message', insertMessageResult.ops);
      });
    });
  })
  .catch(err => {
    console.log(err);
  });

// CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Get initial messages for user from DB
app.get('/messages', async (req, res) => {
  const collection = db.collection('messages');
  const messages = await collection
    .find()
    .limit(100)
    .toArray();
  res.send(messages);
});

http.listen(80, function() {
  console.log('listening on *:80');
});
