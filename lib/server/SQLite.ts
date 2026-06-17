
import path from "path";
import { DatabaseSync } from 'node:sqlite';
import { Task } from "@/lib/server/db";

//process.env.NODE_ENV === "development" ? "db.dev.json" : "db.json";

// const DB_PATH = (process.env.NODE_ENV === "production") ? path.join(process.cwd(), "data", "db.json") : path.join(process.cwd(), "data", "test.json")




const DB_PATH = (process.env.NODE_ENV === "production") ? path.join(process.cwd(), "data", "product.db") : path.join(process.cwd(), "data", "test.db")

export const database = new DatabaseSync(DB_PATH)

database.exec('PRAGMA foreign_keys = on')
database.exec(`CREATE TABLE IF NOT EXISTS users(
    username text UNIQUE NOT NULL,
    id text PRIMARY KEY,
    data text,
    nonce text);
    
  CREATE TABLE IF NOT EXISTS user_credentials(
    userId text PRIMARY KEY,
    passwordHash text NOT NULL,
    wrappedDataKey BLOB NOT NULL,
    salt BLOB NOT NULL,
    nonce BLOB NOT NULL,
    foreign key(userId) references users(id) ON DELETE cascade);
    
  Create TABLE IF NOT EXISTS tasks(
      id text PRIMARY KEY,
      userId text NOT NULL ,
      data text,
      nonce text, 
      foreign key(userId) references users(id) ON DELETE cascade
  );
  
  CREATE TABLE IF NOT EXISTS refresh_tokens(
    id text PRIMARY KEY NOT NULL, 
    isRevoked Integer NOT NULL,
    familyId NOT NULL references token_family(id) ON DELETE cascade
  );


  CREATE TABLE IF NOT EXISTS token_family(
    id Integer PRIMARY KEY AUTOINCREMENT,
    idExp Integer NOT NULL,
    userId text NOT NULL references users(id) ON DELETE cascade

  
  )
 `)//need to add references users(id)


export const authSql = {
  getUser: database.prepare(`SELECT u.username, u.id, c.passwordHash, c.salt, c.wrappedDataKey, c.nonce
     FROM users u join user_credentials c on u.id = c.userId WHERE u.username = ? `),
  getUserSalt: database.prepare(`SELECT c.salt FROM users u join user_credentials c on u.id = c.userId WHERE u.username = ?  `),
  createUserId: database.prepare(`INSERT INTO users(username, id) values(?,?)`),
  createUserCred: database.prepare(`INSERT INTO user_credentials(userId, passwordHash, wrappedDataKey, salt, nonce) values(?,?,?,?,?)`),




  generateFamily: database.prepare(`INSERT INTO token_family(idExp,userId) values(?,?)`),
  generateToken: database.prepare(`INSERT INTO refresh_tokens(id, isRevoked, familyId) values(?,?,?)`),

  getToken: database.prepare(`SELECT r.isRevoked, t.id as familyId, t.idExp as idExp , t.userId 
    from refresh_tokens r  JOIN token_family t ON r.familyId = t.id 
    where r.id = ?`),

  deletFamily: database.prepare(`DELETE FROM token_family where id = ?`),
  revokeToken: database.prepare(`UPDATE refresh_tokens SET isRevoked = 1 where id = ?`)


}

export const dataSql = {

  getTasks: database.prepare(`SELECT id, data, nonce FROM tasks where userId = @userId`),
  getTask: database.prepare(`SELECT * FROM tasks where id= @id and userId = @userId`),
  createTask: database.prepare(`INSERT INTO tasks(id, userId,data, nonce) values(@id,@userId,@data,@nonce)`),
  updateTask: database.prepare(`UPDATE tasks SET data = @data, nonce = @nonce where id = @id and userId = @userId`),
  deleteTask: database.prepare(`DELETE FROM tasks where id = @id and userId = @userId`),
  getUserData: database.prepare(`SELECT data, nonce FROM users where id = ?`),
  saveUserData: database.prepare(`UPDATE users SET data = @data, nonce = @nonce where id = @userId `)
}