"use client"
import _sodium from "libsodium-wrappers-sumo"

await _sodium.ready
export const sodium = _sodium

const fetchData = async (method: string, path: string, data: Uint8Array, nonce: Uint8Array, accessToken: string) => {
    return await fetch(path, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        method,
        body: JSON.stringify({ data, nonce })

    })

}

export const fetchRefresh = async (): Promise<{ accessToken: string }> => {
    const res = await fetch("/api/auth/refresh", { method: "get", headers: { "Content-Type": "application/json" } })
    if (!res.ok) {

        throw new Error(`Refresh failed at  : ${res.status}`)

    }
    return res.json()

}

export const dataApi = {
    sendData: async (method: string, path: string, body: Record<string, unknown>, key: Uint8Array, accessToken: string) => {


        const message = sodium.from_string(JSON.stringify(body))
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
        const data = sodium.crypto_secretbox_easy(message, nonce, key)

        const res = await fetchData(method, path, data, nonce, accessToken)

        if (!res.ok && res.status === 401) {
            const tokens = await fetchRefresh()
            accessToken = tokens.accessToken
            return await fetchData(method, path, data, nonce, accessToken)

        }
        return res

    }

}