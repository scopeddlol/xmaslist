import type { GiftItem, GiftList, GiftListWithItems, ScrapeResult } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: init?.body ? { "content-type": "application/json", ...init?.headers } : init?.headers,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error((payload as { error?: string })?.error ?? "Something went wrong");

    return payload as T;
}

export const api = {
    lists: () => request<GiftListWithItems[]>("/api/lists"),
    list: (id: string) => request<GiftListWithItems>(`/api/lists/${id}`),

    createList: (body: { name: string; description?: string | null }) =>
        request<GiftListWithItems>("/api/lists", { method: "POST", body: JSON.stringify(body) }),

    updateList: (id: string, body: Partial<GiftList>) =>
        request<GiftList>(`/api/lists/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    deleteList: (id: string) => request<{ ok: true }>(`/api/lists/${id}`, { method: "DELETE" }),

    createItem: (listId: string, body: Partial<GiftItem>) =>
        request<GiftItem>(`/api/lists/${listId}/items`, { method: "POST", body: JSON.stringify(body) }),

    updateItem: (id: string, body: Partial<GiftItem>) =>
        request<GiftItem>(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    deleteItem: (id: string) => request<{ ok: true }>(`/api/items/${id}`, { method: "DELETE" }),

    reorder: (ids: string[]) => request<{ ok: true }>("/api/items/reorder", { method: "POST", body: JSON.stringify({ ids }) }),

    scrape: (url: string) => request<ScrapeResult>("/api/scrape", { method: "POST", body: JSON.stringify({ url }) }),

    importMarkdown: (listId: string, markdown: string, name?: string) =>
        request<GiftListWithItems & { imported: number }>(`/api/lists/${listId}/import`, {
            method: "POST",
            body: JSON.stringify({ markdown, name }),
        }),
};
