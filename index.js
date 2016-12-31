const express = require('express'),
  https = require('https'),
  fs = require('fs'),
  aws = require('aws-sdk'),
  //This will be used to generate a UUID for Salts
  //Can use any other good RNG though.
  uuidV4 = require('uuid/v4'),
  //Will use the native nodeJS crypto module, and use sha256 as the hashing function
  crypto = require('crypto'),
  HASHING_FUNCTION_NAME = 'sha256';
  
const credentials = JSON.parse(fs.readFileSync('credentials.json', 'UTF-8')),
  awsSecretKey = credentials.amazon.AWSSecretKey,
  awsAccessKeyId = credentials.amazon.AWSAccessKeyId,
  USER_TABLE_NAME = 'jacksonStoneTestUsers',
  //AWS requires a credentials object when creating any of its API objects.
  //If none is included, it will check in ~/.aws/credentials for your access key and secret key
  awsCreds = new aws.Credentials(awsAccessKeyId, awsSecretKey);
  DYNAMO = new aws.DynamoDB({
    credentials:awsCreds, 
    apiVersion: '2012-08-10',
    //This will need to be set to your particular region
    region: 'us-east-1',
  }),
  app = express();


//Express Setup
app.set('view engine', 'pug');
app.use('/favicon.ico', express.static('favicon.ico')); //For style!
app.get('/', function (req, res) {
  res.render('index');
});



app.post('/create-user', function(req,res){
    req.on('data', function(reqBody){
      try { var body = JSON.parse(reqBody+''); }
      catch(err){ return res.status(400).send(); }
      
      let desiredUserName = body.username,
        desiredPassword = body.password;
      
      //Make sure they included both attributes, and they are non-empty
      if(!desiredUserName) {return res.status(400).send('No Username!');}
      //Now would also be the time to verify their password/usernames are appropriate
      //(Example: at least 6 char password.)
      if(!desiredPassword || desiredPassword.length < 6) {return res.status(400).send('Password must be at least 6 charecters long!');}


      //Now we check if a user with that username already exists:
      getUser(desiredUserName, (err, data)=>{
        //had an issue with method call
        if(err){ return res.status(400).send(err); }
        //Found a user with that same name!
        if(data) return res.status(400).send('Username already taken!');
        
        //If the username is unique, create the user
        createNewUser(desiredUserName, desiredPassword, (err, data)=>{
          if(err) return res.status(400).send(err);
          //Otherwise it was successful
          res.send('Successfully created: ' + desiredUserName);
        });
      });
    });
});

app.post('/check-password', function(req,res){
  req.on('data', function(reqBody){
    try { var body = JSON.parse(reqBody+''); }
    catch(err){ return res.status(400).send('Invalid input format'); }
    if(!body.username || !body.password) {
      return res.status(400).send('need username and password');
    }
    checkCredentials(body.username, body.password, function(err, data){
      if(err) return res.status(400).send(err);
      //Successfully logged in
      res.status(200).send('Correct credentials for: '+data.Username.S+'!');
    });
    
  });
});

function getUser(username, callback){
  //Query for users with that username
  const query = {
    Key: {
      Username:{
        S:username
      }
    }, 
    TableName: USER_TABLE_NAME
  }
  DYNAMO.getItem(query, (err, data) => {
      callback(err, data.Item);
  });
}

function createNewUser(username, password, callback) {
  let salt = getSalt(),
    passwordHash = hashPassword(password,salt),
    item = {
      Username: {S: username+''},
      Salt: {S:salt+''},
      Password: {S:passwordHash+''}
    },
    params = {
      Item:item,
      TableName:USER_TABLE_NAME
    };
    //Insert the user into our DynamoDB table
  DYNAMO.putItem(params,(err, data) => {
    callback(err, data);
  });
}

function getSalt(){
  return uuidV4();
}

function hashPassword(password, salt){
  hashFunction = crypto.createHash(HASHING_FUNCTION_NAME);
  //Logic specific to the crypto module 
  //(https://nodejs.org/api/crypto.html#crypto_hash_update_data_input_encoding)
  return hashFunction.update(password+salt).digest('base64');
}

function checkCredentials(username, password, callback) {
  //First we get the info for the user the client is attempting to check
  getUser(username, (err, user) => {
    if(err) return callback(err);
    if(!user) return callback('Invalid Username');
  
  //We hash the password sent to us from the client with the user's salt value
    const sentPassword_Hashed = hashPassword(password, user.Salt.S);
    //We check if the hash result matches the hash value stored in the database
    if(sentPassword_Hashed===user.Password.S) {
      //Correct password for that username!
      callback(null, user);
    } else {
      callback('Incorrect password!');
    }
  });
}


app.listen(1337, function () {
  console.log('Example app listening on port 1337!');
});


