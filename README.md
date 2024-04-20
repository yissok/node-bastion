```
mkdir -p ~/data/db
mkdir -p ~/data/log/mongodb
chown andrea ~/data/db
chown andrea ~/data/log/mongodb
mongod --dbpath ~/data/db --logpath ~/data/log/mongodb/mongo.log --fork
mongosh

ps -ef | grep mongod
kill -9 <process num>
```

add this to hosts file 
`127.0.0.1	yissok.online`


npm start
npm start
npm start
npm start

`npm start`

TODO:
- migrate both spring boot and nodejs to fargate to simplify
  - dockerise backend api
  - dockerise frontend api
  - manually deploy backend
  - manually deploy frontend
  - cloudformation backend
  - cloudformation frontend
  - cleanup post script for ENI api gateway
  
- s3 bucket serve website
  - ~~create new repo~~
  - update bucket on push to main

- per user rate limiting
- split up into ui server stack, static ui stack, backend stack  
- tool to generate guest username and password

- split auth file up
- check user does not exist already
- forgot password endpoint
- make ejs pages prettier
- start ios app
  - play with app store receipt verification endpoint
  - pricing comes in when the user needs to do more than a certain number of requests


TODO grave:
- password 6 char
- make it work with online mongo
- host on aws through cloudformation
- extract configuration out of code and into config files
