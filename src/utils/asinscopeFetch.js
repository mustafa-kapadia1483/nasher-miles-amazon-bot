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

  await delay(5_000)

  console.log({ apiKey: ASINSCOPE_API_KEY })
  let message = ''
  let status = ''
  let productData = null
  try {
    const response = await fetch(requestURL, { method: 'GET' })
    const responseJson = await response.json()

    // productData = responseJson?.items?.[0]

    // testing remove
    productData = {
      asin: 'B01NAL48FU',
      ean: '5023231006851',
      upc: '754806251172',
      mpn: 'DWIN500-5',
      bsr: 1087,
      category: 'Sports & Outdoors',
      brand: 'Winmau',
      title: 'Winmau Blade 5 Bristle Dartboard',
      productGroup: 'Sports',
      lowestNewPrice: 64.99,
      lowestFormattedPrice: '$64.99',
      soldByAmazon: false,
      packageDimensions: {
        height: 1.77,
        width: 17.8,
        length: 17.8,
        weight: 10.89
      },
      upcList: ['754806251172'],
      eanList: ['5023231006851'],
      totalNew: 2,
      smallImage: 'https://images-na.ssl-images-amazon.com/images/I/51ZUUBEJISL.jpg',
      mediumImage: 'https://images-na.ssl-images-amazon.com/images/I/51ZUUBEJISL.jpg'
    }
    // testing remove

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
