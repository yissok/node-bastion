```
sudo mkdir -p ~/data/db
sudo mkdir -p ~/data/log/mongodb
sudo chown andrea ~/data/db
sudo chown andrea ~/data/log/mongodb
mongod --dbpath ~/data/db --logpath ~/data/log/mongodb/mongo.log --fork
mongosh
```

`npm start*`