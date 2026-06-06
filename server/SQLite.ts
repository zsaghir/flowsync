
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
    seconds number,
    is_running number,
    last_saved number);
    
  CREATE TABLE IF NOT EXISTS user_credentials(
    user_id text PRIMARY KEY,
    passwordHash text NOT NULL,
    wrappedDataKey text NOT NULL,
    salt text NOT NULL,
    nonce text NOT NULL,
    foreign key(user_id) references users(id) ON DELETE cascade);
    
  Create TABLE IF NOT EXISTS tasks(
      id text PRIMARY KEY,
      user_id text ,
      title text,
      completed number NOT NULL,
      foreign key(user_id) references users(id) ON DELETE cascade
  );
  
 `)
export const sqlStatements = {
    getUser: database.prepare(`SELECT * FROM users u join user_credentials c on u.id = c.user_id WHERE u.username = ? `),
    createUserId: database.prepare(`INSERT INTO users(username, id) values(?,?)`),
    createUserCred: database.prepare(`INSERT INTO user_credentials(user_id, passwordHash, wrappedDataKey, salt, nonce) values(?,?,?,?,?)`),
    getTasks: database.prepare(`SELECT * FROM tasks where user_id = ?`),
    getTask: database.prepare(`SELECT * FROM tasks where id= ? and user_id = ?`),
    createTask: database.prepare(`INSERT INTO tasks(id, user_id,title,completed) values(?,?,?,?)`),
    updateTask: (columns: string) => database.prepare(`UPDATE tasks SET ${columns} where id = ? and user_id = ?`),
    deleteTask: database.prepare(`DELETE FROM tasks where id = ? and user_id = ?`),
    getTimer: database.prepare(`SELECT mode, seconds, is_running, last_saved FROM users where id = ?`),
    saveTimer: database.prepare(`UPDATE users SET mode = ? , seconds = ? , is_running = ?, last_saved = ? where id = ? `)

}