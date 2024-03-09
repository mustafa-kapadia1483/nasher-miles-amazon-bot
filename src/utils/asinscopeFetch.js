export default async function asinscopeFetch(asin) {
  const API_KEY = process.env.MAIN_VITE_ASINSCOPE_API_KEY

  if (API_KEY == undefined) {
    return {
      status: 'error',
      message: 'API KEY not found'
    }
  }

  const requestURL = encodeURI(
    `https://api.asinscope.com/products/lookup?key=${API_KEY}&asin=${asin}&domain=in`
  )

  console.log({ apiKey: API_KEY })
  let ean = ''
  let message = ''
  let status = ''
  try {
    const response = await fetch(requestURL, { method: 'GET' })
    const responseJson = await response.json()

    ean = responseJson?.items?.[0]?.ean || 'NA'

    if (ean == 'NA') {
      status = 'error'
      message = `Could not fetch EAN for ${asin} - ${responseJson['error']}`
    }

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
