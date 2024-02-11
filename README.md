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

`npm start`

TODO:
- email instead of username
- provide env variables via command line
  - gh actions secrets
- check user does not exist already
- ts config mongodb Option 'importsNotUsedAsValues' is deprecated and will stop functioning in TypeScript 5.5. Specify compilerOption '"ignoreDeprecations": "5.0"' to silence this error.Use 'verbatimModuleSyntax' instead.ts
- use registration pass so that only people you allow can access registration page, do that by including it in the url as a urlparam, then check that the url param matches pass, that way you dont need to tell teh user "ok go to registration page and use this pass"
- forgot password endpoint