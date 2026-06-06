import { sqlStatements, database } from "./SQLite";

export type User = { id: string; username: string; };
export type UserCredientials = { id: string; passwordHash: string, wrappedDataKey: string, salt: String, nonce: String };
export type Task = { id: string; userId: string; title: string; completed: boolean; };
export type TimerState = {
  mode: "pomodoro" | "break" | "stopwatch";
  seconds: number;   // remaining for countdown; elapsed for stopwatch
  isRunning: number;
  lastSaved: number;   // Date.now() ms — used to recalculate on resume
};

export interface TaskChange { title: String | null, completed: number | null }

export const db = {
  getUser: (username: string) => {

    const userDetails = sqlStatements.getUser.get(username) as UserCredientials & { username: string } | undefined

    return userDetails ? userDetails : null
  },

  createUser: (id: string,
    username: string,
    passwordHash: string,
    wrappedDataKey: string,
    salt: string,
    nonce: string): { ok: true, value: User } | { ok: false, error: String } => {
    try {

      database.exec(`BEGIN TRANSACTION`)
      sqlStatements.createUserId.run(username, id);

      sqlStatements.createUserCred.run(id, passwordHash, wrappedDataKey, salt, nonce)
      database.prepare(`COMMIT`).run()


      return { ok: true, value: { id, username } }
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

  getTasks: (id: string) => {
    const tasks = sqlStatements.getTasks.all(id) as unknown as Task[]
    console.log("Your task is: ", tasks)
    return tasks

  },

  createTask: (task: Task) => {
    const result = sqlStatements.createTask.run(task.id, task.userId, task.title, task.completed ? 1 : 0)
    return { result: result, task }

  },
  deleteTask: (id: string, user_id: string) => {
    return sqlStatements.deleteTask.run(id, user_id)
  },

  getTask: (id: string, user_id: string): Task | undefined => {
    return sqlStatements.getTask.get(id, user_id) as Task | undefined
  },

  updateTask: (taskChanges: Partial<TaskChange>, id: string, user_id: string) => {
    const keys = Object.keys(taskChanges) as (keyof TaskChange)[]
    if (keys.length == 0) { throw Error }
    const columns = keys.map(column => `${column} = ?`).join(", ")
    const values: any[] = keys.map(column => taskChanges[column])
    return sqlStatements.updateTask(columns).run(...values, id, user_id)
  },
  getTimer: (id: string) => {
    const result = sqlStatements.getTimer.get(id)
    return result
  },

  saveTimer: (state: TimerState, id: string) => {
    console.log
    return sqlStatements.saveTimer.run(state.mode, state.seconds, Number(state.isRunning), state.lastSaved, id)
  }
}
