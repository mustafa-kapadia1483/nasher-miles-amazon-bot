import delay from './delay'

export async function asinscopeFetch(asin) {
  /* Check if ean store already has this data */
  const ASINSCOPE_API_KEY = import.meta.env.VITE_ASINSCOPE_API_KEY

  if (ASINSCOPE_API_KEY == undefined) {
    return {
      status: 'error',
      message: 'API KEY not found',
      productData
    }
  }

  const requestURL = encodeURI(
    `https://api.asinscope.com/products/lookup?key=${ASINSCOPE_API_KEY}&asin=${asin}&domain=in`
  )

  // await delay(1_000)

  console.log({ apiKey: ASINSCOPE_API_KEY })
  let message = 'EAN Fetched Successfully'
  let status = 'success'
  let productData = null
  try {
    const response = await fetch(requestURL, { method: 'GET' })
    const responseJson = await response.json()

    productData = responseJson?.items?.[0]

    if (productData == null) {
      productData = {}
      status = 'error'
      message = `Could not fetch EAN for ${asin} - ${responseJson['error'] ?? 'EAN not found'}`
    }

    console.log(responseJson)
  } catch (e) {
    console.error(e)
    message = `EAN fetch API call failed, ${e}`
    status = 'error'
  }

  return {
    status,
    message,
    productData
  }
}
