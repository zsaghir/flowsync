import { sqlStatements, database } from "./SQLite";

export type User = { id: string; username: string; };
export type UserCredientials = { id: string; passwordHash: string, wrappedDataKey: string, salt: string, nonce: string };
export type Task = { id: string; userId: string; title: string; completed: boolean; };
type TaskRow = { id: string, userId: string, title: string, completed: number }
export type TimerState = {
  mode: "pomodoro" | "break" | "stopwatch";
  seconds: number;   // remaining for countdown; elapsed for stopwatch
  isRunning: number;
  lastSaved: number;   // Date.now() ms — used to recalculate on resume
};

export interface TaskChange { title: string | null, completed: number | null }
const updateTaskAllowedKeys = new Set(['title', 'completed'])

export const db = {
  getUser: (username: string) => {

    const userDetails = sqlStatements.getUser.get(username) as UserCredientials & { username: string } | undefined

    return userDetails ? userDetails : null
  },

  getUserSalt: (username: string) => {

    const userDetails = sqlStatements.getUserSalt.get(username) as { salt: string }

    return userDetails ? userDetails : null
  },

  createUser: (id: string,
    username: string,
    passwordHash: string,
    wrappedDataKey: string,
    salt: string,
    nonce: string): { ok: true, value: User } | { ok: false, error: string } => {
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
    const tasks = sqlStatements.getTasks.
      all(id) as TaskRow[] | null;
    return tasks?.map(r => ({ ...r, completed: Boolean(r.completed) })) as Task[]

  },

  createTask: (task: Task) => {
    const result = sqlStatements.createTask.run(task.id, task.userId, task.title,
      task.completed ? 1 : 0)
    return { result: result, task }

  },
  deleteTask: (id: string, userId: string) => {
    return sqlStatements.deleteTask.run(id, userId)
  },

  getTask: (id: string, userId: string): Task | undefined => {
    const result = sqlStatements.getTask.get(id, userId) as TaskRow | undefined
    if (result) { return { ...result, completed: Boolean(result.completed) } } else { throw Error("task not found") }
  },

  updateTask: (taskChanges: Partial<TaskChange>, id: string, userId: string) => {

    const keys = Object.keys(taskChanges).filter(key => updateTaskAllowedKeys.has(key)) as (keyof TaskChange)[]
    if (keys.length == 0) { throw Error("Key Length is 0") }
    const columns = keys.map(column => `${column} = ?`).join(", ")
    const values: any[] = keys.map(column => taskChanges[column])
    return sqlStatements.updateTask(columns).run(...values, id, userId)
  },
  getTimer: (id: string) => {
    const result = sqlStatements.getTimer.get(id)
    return result
  },

  saveTimer: (state: TimerState, id: string) => {
    return sqlStatements.saveTimer.run(state.mode, state.seconds, Number(state.isRunning), state.lastSaved, id)
  }
}
