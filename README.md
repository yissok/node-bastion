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
- make it work with online mongo
- host on aws through cloudformation
- check user does not exist already
- forgot password endpoint
- make ejs pages prettier
- start ios app
  - play with app store receipt verification endpoint
  - pricing comes in when the user needs to do more than a certain number of requests