import { createContext, useContext, useState } from 'react'

interface ApiKeyContextType {
  apiKey: string
  setApiKey: (key: string) => void
}

const ApiKeyContext = createContext<ApiKeyContextType>({ apiKey: '', setApiKey: () => {} })

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem('blub_api_key') ?? '')

  function setApiKey(key: string) {
    setApiKeyState(key)
    localStorage.setItem('blub_api_key', key)
  }

  return <ApiKeyContext.Provider value={{ apiKey, setApiKey }}>{children}</ApiKeyContext.Provider>
}

export function useApiKey() {
  return useContext(ApiKeyContext)
}
