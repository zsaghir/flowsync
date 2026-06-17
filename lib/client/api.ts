"use client"

import _sodium from "libsodium-wrappers-sumo"
import z from "zod"

await _sodium.ready
export const sodium = _sodium

const fetchTasksSchema = z.array(z.object({
    id: z.string(),
    data: z.string(),
    nonce: z.string()

}))
export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    completed: z.union([z.number(), z.boolean()])

})
export const TasksArraySchema = z.array(TaskSchema)


const SaltFetchSchema = z.object({ salt: z.string() })
const FetchErrorSchema = z.object({ error: z.string() })
const RefershTokenResponseSchema = z.object({ accessToken: z.string() })
const DataResponseSchema = z.object({ data: z.string(), nonce: z.string() })


const UserSchema = z.object({ id: z.string(), username: z.string() })

const LoginFetchSchema = z.object({
    accessToken: z.string(),
    wrappedDataKey: z.string(),
    nonce: z.string(),
    user: UserSchema
})

export const LocalStorageSchema = z.object({
    accessToken: z.string(),
    dataKey: z.instanceof(Uint8Array<ArrayBufferLike>).refine(k => k.length === 32, "key must be 32 bytes"),
    user: UserSchema
})

const FetchUserSchema = z.object({
    accessToken: z.string(),
    user: UserSchema
})
//Helper to make a fetch call to server
const fetchToApi = async (path: string, accessToken: string, method: string, body = null as any) => {
    return await fetch(path, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        method,
        body
    })

}

export const fetchRefresh = async () => {
    const res = await fetch("/api/auth/refresh", { method: "get", headers: { "Content-Type": "application/json" } })
    if (!res.ok) {

        throw new Error(`Refresh failed at  : ${res.status}`)

    }
    const _data = RefershTokenResponseSchema.safeParse(await res.json())
    if (!_data.success) throw new Error(`Didn't get an access token`)

    return _data.data



}


//Client side lib to encrypt data and make fetch call to db
export const dataApi = {
    sendData: async (key: Uint8Array, accessToken: string, path: string, fetchParameters = { body: null, method: "POST" } as
        { body: string | null, method: string }) => {


        let body = null

        if (fetchParameters.body) {
            const message = sodium.from_string(fetchParameters.body)

            const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
            const data = sodium.crypto_secretbox_easy(message, nonce, key)

            body = JSON.stringify({ data: sodium.to_base64(data), nonce: sodium.to_base64(nonce) })


        }


        const res = await fetchToApi(path, accessToken, fetchParameters.method, body)



        if (!res.ok && res.status === 401) {
            const tokens = await fetchRefresh()
            accessToken = tokens.accessToken
            return await fetchToApi(path, accessToken, fetchParameters.method, body)

        }

        return res

    },

    //Function to fetch data and eecrypt it 
    fetchData: async (key: Uint8Array, accessToken: string, path: string, fetchParameters = { body: null, method: "GET" } as { body: string | null, method: string }) => {

        let res = await fetchToApi(path, accessToken, fetchParameters.method, fetchParameters.body);

        if (!res.ok && res.status == 401) {
            const tokens = await fetchRefresh()
            accessToken = tokens.accessToken
            res = await fetchToApi(path, accessToken, fetchParameters.method, fetchParameters.body);
        }
        if (!res.ok) {
            const _response = FetchErrorSchema.safeParse(await res.json())
            throw Error(_response.success ? _response.data.error : "Something went wrong");
        }

        const response = await res.json() as unknown
        const dataObject = DataResponseSchema.safeParse(response)
        if (!dataObject.success) {
            const dataArray = fetchTasksSchema.safeParse(response)
            if (!dataArray.success) return response;
            const messages = dataArray.data.map((item) => {
                const ciphertext = sodium.from_base64(item.data);
                const nonce = sodium.from_base64(item.nonce);

                const message = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key, "text");

                return { ...JSON.parse(message), id: item.id };
            });
            return messages

        }
        //if it doesn't have data and a nonce
        const ciphertext = sodium.from_base64(dataObject.data.data,)
        const nonce = sodium.from_base64(dataObject.data.nonce)

        const message = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key, "text")
        return await JSON.parse(message) as unknown


    }
}



//User Login and Signup modules
function encryptPassword(password: string, salt: Uint8Array): { authKey: Uint8Array, encryptionKey: Uint8Array } {
    const derived = sodium.crypto_pwhash(
        64, password, salt,
        sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        sodium.crypto_pwhash_MEMLIMIT_MODERATE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
    );
    return { authKey: derived.slice(0, 32), encryptionKey: derived.slice(32, 64) }

}

export const userLogin = async (username: string, password: string) => {
    const saltFetch = await fetch("/api/auth/login/start", {
        method: "Post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username

        })
    })



    if (!saltFetch.ok) {
        const saltResponse = FetchErrorSchema.parse((await saltFetch.json()))
        return saltResponse

    }

    const saltResponse = SaltFetchSchema.parse(await saltFetch.json())
    const salt = sodium.from_base64(saltResponse.salt);
    const keys = encryptPassword(password, salt)

    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            authKey: sodium.to_base64(keys.authKey)
        })

    }).then(async (res) => {

        if (!res.ok) {
            const response = FetchErrorSchema.safeParse(await res.json())

            return { error: (response.success ? response.data.error : "Something went wrong") }
        }
        const data = LoginFetchSchema.parse(await res.json())

        if (!data.wrappedDataKey || !data.nonce) { return { error: "Server Error" } }

        const wrappedDataKey = sodium.from_base64(data.wrappedDataKey)
        const nonce = sodium.from_base64(data.nonce)
        const dataKey = sodium.crypto_secretbox_open_easy(wrappedDataKey, nonce, keys.encryptionKey)
        return LocalStorageSchema.parse({ user: data.user, accessToken: data.accessToken, dataKey })

    })
    return res



}

export const userSignup = async (username: string, password: string) => {

    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_argon2id_SALTBYTES) //Used for encryption password
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const dataKey = sodium.randombytes_buf(32);
    const keys = encryptPassword(password, salt)

    const wrappedDataKey = sodium.crypto_secretbox_easy(dataKey, nonce, keys.encryptionKey)

    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
            {
                username
                , authKey: sodium.to_base64(keys.authKey)
                , wrappedDataKey: sodium.to_base64(wrappedDataKey)
                , salt: sodium.to_base64(salt)
                , nonce: sodium.to_base64(nonce)
            }),
    }).then(async (res) => {
        if (!res.ok) {
            const response = FetchErrorSchema.safeParse(await res.json())
            return { error: (response.success ? response.data.error : "Something went wrong") }
        }
        const data = FetchUserSchema.parse(await res.json())

        return LocalStorageSchema.parse({ ...data, dataKey })

    })
    return res

}