import ElectronStore from 'electron-store'
import delay from './delay'

let eanStore = new ElectronStore()

export async function asinscopeFetch(asin) {
  /* Check if ean store already has this data */
  let cachedEan = eanStore.get(asin)
  if (cachedEan) {
    return {
      status: 'success',
      message: 'Fetched from cached ean store',
      ean: cachedEan
    }
  }

  const API_KEY = import.meta.env.VITE_ASINSCOPE_API_KEY
  let ean = 'NA'

  if (API_KEY == undefined) {
    return {
      status: 'error',
      message: 'API KEY not found',
      ean
    }
  }

  const requestURL = encodeURI(
    `https://api.asinscope.com/products/lookup?key=${API_KEY}&asin=${asin}&domain=in`
  )

  await delay(5_000)

  console.log({ apiKey: API_KEY })
  let message = ''
  let status = ''
  try {
    const response = await fetch(requestURL, { method: 'GET' })
    const responseJson = await response.json()

    ean = responseJson?.items?.[0]?.ean || 'NA'

    if (ean == 'NA') {
      status = 'error'
      message = `Could not fetch EAN for ${asin} - ${responseJson['error'] ?? 'EAN not found'}`
    }

    eanStore.set(asin, ean)

    console.log(responseJson)
  } catch (e) {
    message = `EAN fetch API call failed, ${e}`
    status = 'error'
  }

  return {
    status,
    message,
    ean
  }
}

export function clearCachedStore() {
  eanStore.clear()
}
