for (const name of ['report','audit']) {
  db.getSiblingDB(name).createUser({
    user:name, pwd:process.env['MONGO_'+name.toUpperCase()+'_PASSWORD'],
    roles:[{role:'readWrite',db:name}]
  });
}
