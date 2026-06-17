import { authSql, database, dataSql } from "./SQLite";
import z, { string } from "zod"
export type User = { id: string; username: string; };
export type UserCredientials = { id: string; passwordHash: string, wrappedDataKey: string, salt: string, nonce: string };
export type Task = z.infer<typeof TaskSchema>
export type NewTask = z.infer<typeof CreateTaskSchema>
export type DataCipher = z.infer<typeof DataCipherSchema>
export type UserData = z.infer<typeof UserDataSchema>

export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  data: z.string(),
  nonce: z.string()

})

export const CreateTaskSchema = z.object({
  data: z.string(),
  nonce: z.string()

})

export const DataCipherSchema = z.object({
  data: z.string(),
  nonce: z.string()
})

export const UserDataSchema = DataCipherSchema.extend({ userId: z.string() })

export const authDb = {
  getUser: (username: string) => {

    const userDetails = authSql.getUser.get(username)


    return userDetails
  },

  getUserSalt: (username: string) => {

    const userDetails = authSql.getUserSalt.get(username)


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


  getTasks: (userId: string) => {
    const tasks = dataSql.getTasks.all({ userId })

    return tasks

  },

  createTask: (task: Task) => {
    const result = dataSql.createTask.run(task)
    return { result: result, task }

  },
  deleteTask: (id: string, userId: string) => {
    return dataSql.deleteTask.run({ id, userId })
  },

  getTask: (id: string, userId: string) => {
    const result = dataSql.getTask.get({ id, userId })
    if (result) { return result } else { throw Error("task not found") }
  },

  updateTask: (patch: Task) => {
    console.log(patch)
    const result = dataSql.updateTask.run(patch)
    return result
  },
  getUserData: (id: string) => {
    const result = dataSql.getUserData.get(id)
    return result
  },

  saveUserData: (userData: UserData) => {
    return dataSql.saveUserData.run(userData)
  }
}
