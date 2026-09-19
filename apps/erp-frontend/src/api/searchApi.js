import api from "./axios"

export const globalSearch = (query) => {
  return api.get(`/search?q=${encodeURIComponent(query)}`)
}
