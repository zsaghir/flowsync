
import path from "path";
import { DatabaseSync } from 'node:sqlite';

//process.env.NODE_ENV === "development" ? "db.dev.json" : "db.json";

// const DB_PATH = (process.env.NODE_ENV === "production") ? path.join(process.cwd(), "data", "db.json") : path.join(process.cwd(), "data", "test.json")




const DB_PATH = (process.env.NODE_ENV === "production") ? path.join(process.cwd(), "data", "prod.db") : path.join(process.cwd(), "data", "test.db")

export const database = new DatabaseSync(DB_PATH)

database.exec('PRAGMA foreign_keys = on')
database.exec(`CREATE TABLE IF NOT EXISTS users(
    username text UNIQUE NOT NULL,
    id text PRIMARY KEY,
    mode text CHECK (mode IN ('pomodoro', 'break', 'stopwatch')),
    seconds Integer,
    isRunning Integer,
    lastSaved Integer);
    
  CREATE TABLE IF NOT EXISTS user_credentials(
    userId text PRIMARY KEY,
    passwordHash text NOT NULL,
    wrappedDataKey text NOT NULL,
    salt text NOT NULL,
    nonce text NOT NULL,
    foreign key(userId) references users(id) ON DELETE cascade);
    
  Create TABLE IF NOT EXISTS tasks(
      id text PRIMARY KEY,
      userId text ,
      title text,
      completed Integer NOT NULL,
      foreign key(userId) references users(id) ON DELETE cascade
  );
  
 `)
export const sqlStatements = {
    getUser: database.prepare(`SELECT * FROM users u join user_credentials c on u.id = c.userId WHERE u.username = ? `),
    getUserSalt: database.prepare(`SELECT c.salt FROM users u join user_credentials c on u.id = c.userId WHERE u.username = ?  `),
    createUserId: database.prepare(`INSERT INTO users(username, id) values(?,?)`),
    createUserCred: database.prepare(`INSERT INTO user_credentials(userId, passwordHash, wrappedDataKey, salt, nonce) values(?,?,?,?,?)`),

    getTasks: database.prepare(`SELECT * FROM tasks where userId = ?`),
    getTask: database.prepare(`SELECT * FROM tasks where id= ? and userId = ?`),
    createTask: database.prepare(`INSERT INTO tasks(id, userId,title,completed) values(?,?,?,?)`),
    updateTask: (columns: string) => database.prepare(`UPDATE tasks SET ${columns} where id = ? and userId = ?`),
    deleteTask: database.prepare(`DELETE FROM tasks where id = ? and userId = ?`),

    getTimer: database.prepare(`SELECT mode, seconds, isRunning, lastSaved FROM users where id = ?`),
    saveTimer: database.prepare(`UPDATE users SET mode = ? , seconds = ? , isRunning = ?, lastSaved = ? where id = ? `)

}