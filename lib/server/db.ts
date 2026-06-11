import { authSql, database, dataSql } from "./SQLite";

export type User = { id: string; username: string; };
export type UserCredientials = { id: string; passwordHash: string, wrappedDataKey: string, salt: string, nonce: string };
export type Task = { id: string, userId: string, data: Uint8Array, nonce: Uint8Array };

// export type TimerState = {

//   mode: "pomodoro" | "break" | "stopwatch";
//   seconds: number;   // remaining for countdown; elapsed for stopwatch
//   isRunning: number;
//   lastSaved: number;   // Date.now() ms — used to recalculate on resume
// };

export interface TaskChange { title: string | null, completed: number | null }


export const authDb = {
  getUser: (username: string) => {

    const userDetails = authSql.getUser.get(username) as UserCredientials | undefined

    return userDetails ? userDetails : null
  },

  getUserSalt: (username: string) => {

    const userDetails = authSql.getUserSalt.get(username) as { salt: string }

    return userDetails ? userDetails : null
  },

  createUser: (id: string,
    username: string,
    passwordHash: string,
    wrappedDataKey: string,
    salt: string,
    nonce: string): { ok: true, id: string } | { ok: false, error: string } => {
    try {

      database.exec(`BEGIN TRANSACTION`)
      authSql.createUserId.run(username, id);

      authSql.createUserCred.run(id, passwordHash, wrappedDataKey, salt, nonce)
      database.prepare(`COMMIT`).run()


      return { ok: true, id }
    } catch (error: any) {
      database.exec('ROLLBACK')
      if (error.errcode === 1555 || error.errcode === 2067) {

        return { ok: false, error: "username taken" }
      }
      else {
        throw error
      }
    }

  },
}

export const dataDb = {


  getTasks: (id: string) => {
    const tasks = dataSql.getTasks.
      all(id) as Task[] | null;
    return tasks

  },

  createTask: (task: Task) => {
    const result = dataSql.createTask.run(task.id, task.userId, task.data,
      task.nonce)
    return { result: result, task }

  },
  deleteTask: (id: string, userId: string) => {
    return dataSql.deleteTask.run(id, userId)
  },

  getTask: (id: string, userId: string): Task | undefined => {
    const result = dataSql.getTask.get(id, userId) as Task | undefined
    if (result) { return result } else { throw Error("task not found") }
  },

  updateTask: (patch: Task) => {
    const result = dataSql.updateTask.run(patch.data,
      patch.nonce, patch.id, patch.userId)
    return result
  },
  getUserData: (id: string) => {
    const result = dataSql.getUserData.get(id)
    return result
  },

  saveUserData: (data: Uint8Array, nonce: Uint8Array, id: string) => {
    return dataSql.getUserData.run(data, nonce, id)
  }
}
