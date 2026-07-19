import { createContext, useContext, useState } from 'react'

const RegionContext = createContext(null)

const STORAGE_KEY = 'jes_region'

function loadRegion() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'usa' ? 'usa' : 'ghana'
}

export function RegionProvider({ children }) {
  const [region, setRegionState] = useState(loadRegion)

  const setRegion = (next) => {
    localStorage.setItem(STORAGE_KEY, next)
    setRegionState(next)
  }

  const currency = region === 'usa' ? 'USD' : 'GHS'

  return (
    <RegionContext.Provider value={{ region, setRegion, currency }}>
      {children}
    </RegionContext.Provider>
  )
}

export const useRegion = () => useContext(RegionContext)
