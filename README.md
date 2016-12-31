# DynamoDB/ExpressJS user credentials store
An example of how to store user credentials securely in a DynamoDB table, using ExpressJS.

#Installation:
(Assuming you don't have these installed)

Install NodeJS: [Download here] (https://nodejs.org/)

Install Git: [Follow instructions here] (https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

clone this project, navigate to its root and NPM install: 
```bash
$ git clone https://github.com/jacksonStone/dynamoDBUserPasswordImplementation.git && cd dynamoDBUserPasswordImplementation && npm install
```

Create a *Free* AWS account if you do not already have one: [Here] (aws.amazon.com/free)

Create a file in the root of the project to store your AWS credentials
```bash
$ touch credentials.json
```

Get AWS credentials if you do not already have some: [Instructions here] (http://docs.aws.amazon.com/general/latest/gr/managing-aws-access-keys.html)

Put them in the credentials.json file, structured like so:
```json
{
  "amazon": {
    "AWSSecretKey":"SECRET_KEY_HERE",
    "AWSAccessKeyId":"ACCESS_KEY_HERE"
  }
}
```


Create a table using the AWS Dynamo console, with a Username as the primary/hash key. (take note of the region you create the table in, and the table name): [Here] (https://console.aws.amazon.com/dynamodb/home)

Replace line 15 of index.js with the table name you created earlier like so:
```javascript
USER_TABLE_NAME = 'YOUR_TABLE_NAME',
```
 and line 23 of index.js like so:
```javascript
region: 'YOUR_TABLE_REGION'
```

Boot it up
```bash
$ node index
```

Open a browser to [http://localhost:1337] (http://localhost:1337)

Login away!

#Disclaimer

There are (significantly) better ways to handle authorization to your AWS credentials. This is for demo purposes only.
For more in-depth guide to implementing AWS credentials or IAM visit [Here] (http://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html)
