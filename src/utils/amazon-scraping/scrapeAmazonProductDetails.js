import puppeteer from 'puppeteer'

import fs from 'fs'

const COOKIES_FILE_NAME = 'amazon-cookies'

async function login(page, username, password) {
  if ((await page.$(`input[id*=email]`)) == null) {
    console.log('Already Logged in')
    return
  }

  await page.focus(`input[id*=email]`)
  await page.keyboard.type(username, { delay: 100 })

  await page.focus(`input[id*=password]`)
  await page.keyboard.type(password, { delay: 100 })

  /* Click remember me */
  // await page.click(`[name="rememberMe"]`)

  await page.click('#signInSubmit')

  await page.waitForNavigation({ waitUntil: 'networkidle0' })

  const MFA_REMEMBER_CHECKBOX_SELECTOR = `[id="auth-mfa-remember-device"]`
  if (page.$(MFA_REMEMBER_CHECKBOX_SELECTOR)) {
    page.click(MFA_REMEMBER_CHECKBOX_SELECTOR)
    /* Wait for OTP to be entered & page to be reloaded */
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 50_000 })
  }
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

//save cookie function
async function saveCookie(page, filename) {
  const cookies = await page.cookies()
  const cookieJson = JSON.stringify(cookies, null, 2)
  fs.writeFileSync(`${__dirname}/${filename}.json`, cookieJson)
}

//load cookie function
async function loadCookie(page, filename) {
  const cookiesPath = `${__dirname}/${filename}.json`

  if (!fs.existsSync(cookiesPath)) {
    return
  }

  const cookieJson = await fs.readFileSync(cookiesPath)
  const cookies = JSON.parse(cookieJson)

  await page.setCookie(...cookies)
}

/* Scrape data from amazon page */
async function scrapeAmazonPageData(asin) {
  /* delay */
  function delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time)
    })
  }

  async function check_any_element_exists_with_retry_custom(
    selectors,
    retries_count = 50,
    sleep_after_each_retry = 500
  ) {
    let i = 0
    let flag = true
    while (flag) {
      let elements = selectors.map((selector) => document.querySelector(selector))

      if (i < retries_count) {
        if (elements.every((ele) => ele == null)) {
          resp = 'no'
          await delay(sleep_after_each_retry)
        } else {
          flag = false
          resp = 'yes'
        }
      } else {
        flag = false
        resp = 'no'
      }
      i = i + 1
    }
    return resp
  }

  // await check_any_element_exists_with_retry_custom(
  //   [`[id*=detailBulletsWrapper] [id*="detailBullets"] ul li`, `[id*="productDetails"] tr`],
  //   10,
  //   1000
  // )
  let fullName = 'NA'
  let fullNameElement = document.querySelector(`[id^=title] h1`)
  if (fullNameElement) {
    fullName = fullNameElement.innerText.trim()
  }

  let brandName = 'NA'

  const brandNameElementOption1 = document.querySelector(`[class*=po-brand] td:nth-child(2)`)
  const brandNameElementOption2 = document.querySelector(`[class*=brand-snapshot] span`)
  if (brandNameElementOption1) {
    brandName = brandNameElementOption1.innerText
  } else if (brandNameElementOption2) {
    brandName = brandNameElementOption2.innerText
  } else {
    brandName = fullName.split(/\s+/)?.[0]
  }

  /* Extract color, add to brand name if not present in name */
  let color = ''
  const colorElementOption1 = document.querySelector(`[id*=color_name] .selection`)
  if (colorElementOption1) {
    // colorElementOption1.scrollIntoView()
    color = colorElementOption1.textContent.trim()
  }

  /* Check if color not present in full name then add it in */
  if (!fullName.includes(color)) {
    fullName = `${fullName} (${color})`
  }

  /* MRP */
  let mrp = 'NA'
  const mrpElement = document
    .querySelector(`[id*="PriceLegalMessage"]`)
    ?.parentElement.querySelector(`[class*=price] span`)

  if (mrpElement) {
    mrp = mrpElement.textContent.trim().replaceAll(/[^\d.]/gm, '')
  }

  /* Selling price */
  let productSellingPrice = 'NA'
  let productSellingPriceElement = document.querySelector(
    `.priceblock_vat_inc_price [class*=price] span`
  )

  if (productSellingPriceElement) {
    productSellingPrice = productSellingPriceElement.textContent
  }

  /* In case productSellingPriceElement not present check all buying options */
  if (!productSellingPriceElement) {
    /* Click see all buying options */
    let seeAllBuyingOptionsButtonElement = document.querySelector(
      `[title="See All Buying Options"]`
    )
    if (seeAllBuyingOptionsButtonElement) {
      seeAllBuyingOptionsButtonElement?.click()
      const additionalBuyerSellingPriceSelector = `[id="aod-tax-incl-price-1"]`
      await check_any_element_exists_with_retry_custom([additionalBuyerSellingPriceSelector])
      if (document.querySelector(additionalBuyerSellingPriceSelector)) {
        productSellingPrice = document.querySelector(
          additionalBuyerSellingPriceSelector
        ).textContent
      }
    }
  }

  if (productSellingPrice !== 'NA') {
    productSellingPrice = productSellingPrice.trim().replaceAll(/[^\d.]/gm, '')
  }

  let modelName = 'NA'
  let scrapedProductAsin = 'NA'

  /* Product details Option 1*/
  for (let li of document.querySelectorAll(
    `[id*=detailBulletsWrapper] [id*="detailBullets"] ul li`
  )) {
    let [key, value] = li
      .querySelector('span')
      .innerText.split(':')
      .map((text) => text.trim().replaceAll(/\s\s+/g, ''))

    key = key.toLowerCase()
    if (key.includes('model number') || key.includes('part number')) {
      modelName = value
    }

    if (key.includes('asin')) {
      scrapedProductAsin = value.replace(/[^\w\-.,\s]+/gm, '').trim()
    }
  }

  /* Product details Option 2 */
  for (let tr of document.querySelectorAll(`[id*="productDetails"] tr`)) {
    let [key, value] = tr.querySelectorAll('*')
    console.log({ key, value })

    key = key.innerText.toLowerCase()
    value = value.innerText
    if (key.includes('model number') || key.includes('part number')) {
      modelName = value
    }

    if (key.includes('asin')) {
      scrapedProductAsin = value.replace(/[^\w\-.,\s]+/gm, '').trim()
    }
  }
  if (modelName !== 'NA') {
    modelName = modelName.replace(/[^\w\-.,\s]+/gm, '').trim()
    if (colorElementOption1) {
      modelName = `${modelName}-${color}`
    }
  }

  let bulletPoints = ''
  for (let bulletPoint of document.querySelectorAll('.product-facts-title ~ ul')) {
    bulletPoints += `${bulletPoint.innerText.trim()}\n`
  }
  if (bulletPoints == '') {
    for (let bulletPoint of document.querySelectorAll('[id*=featurebullets] ul li')) {
      bulletPoints += `${bulletPoint.innerText.trim()}\n`
    }
  }
  bulletPoints = bulletPoints.trim()

  /* If bullet points still empty read from product description */
  /* First need to remove style, img & noscript tags from product description */
  const productDescriptionDiv = document.querySelector(`[id="aplus"] div`)
  if (bulletPoints.length == 0 && productDescriptionDiv) {
    while (
      productDescriptionDiv.querySelector('style') ||
      productDescriptionDiv.querySelector('noscript') ||
      productDescriptionDiv.querySelector('img')
    ) {
      productDescriptionDiv.querySelector('style')?.remove()
      productDescriptionDiv.querySelector('noscript')?.remove()
      productDescriptionDiv.querySelector('img')?.remove()
    }

    bulletPoints = productDescriptionDiv.innerText.replace(/\s\s+/g, '').trim()
  }

  /* Remove non-ascii values from bullet points */
  bulletPoints = bulletPoints.replace(/[^\x00-\x7F]+/gm, '')

  function dispatchMouseEvents(element) {
    let eventNames = ['mouseeneter', 'mouseover', 'mousemove', 'mouseout', 'mouseleave']
    eventNames.forEach((eventNameString) => {
      let mouseEvent = new MouseEvent(eventNameString, {
        bubbles: true,
        cancelable: true,
        view: window
      })
      element.dispatchEvent(mouseEvent)
    })
  }

  let imageLinksArray = []
  let imageBlockElement = document.querySelector(`[id="imageBlock"] `)
  if (imageBlockElement) {
    for (let img of imageBlockElement.querySelectorAll(`img`)) {
      dispatchMouseEvents(img)
      await delay(100)
    }
    for (let img of imageBlockElement.querySelectorAll(`img[class*= a-stretc]`)) {
      imageLinksArray.push(img.src)
    }
  }

  /* Product rating */
  let rating = 'NA'
  const ratingElement = document.querySelector('#averageCustomerReviews a span')

  if (ratingElement) {
    rating = ratingElement.textContent.trim()
  }

  let stockStatusMessage = 'NA'
  const stockStatusMessageElement = document.querySelector(`[id="availability"]`)

  if (stockStatusMessageElement) {
    stockStatusMessage = stockStatusMessageElement.innerText.trim()
  }

  let gstCreditAvailableStatus = 'TRUE'
  const gstExcludedPriceElement = document.querySelector(`[class*=priceblock_vat_excl]`)
  if (gstExcludedPriceElement) {
    let text = gstExcludedPriceElement.textContent
    if (text.toLowerCase().includes('gst credit not available')) {
      gstCreditAvailableStatus = 'FALSE'
    }
  }

  return {
    brandName,
    fullName,
    mrp,
    productSellingPrice,
    modelName,
    bulletPoints,
    imageLinksArray,
    selectedImageLink: imageLinksArray[0],
    rating,
    stockStatusMessage,
    gstCreditAvailableStatus,
    asin,
    'ASIN Mismatch': scrapedProductAsin == asin ? 'FALSE' : `TRUE - ${scrapedProductAsin}`
  }
}

export async function openBrowserLogin({ username, password }) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  })
  const page = await browser.newPage()

  await loadCookie(page, COOKIES_FILE_NAME)

  await page.goto('https://business.amazon.in/')

  const loginPageURL = await page.$$eval(`[data-pop-up-component-model-close="close"]`, () => {
    document.querySelector(`[data-pop-up-component-model-close="close"]`).click()
    return document.querySelector(`[data-signin-link="true"]`).href
  })

  await page.goto(loginPageURL)
  // await page.waitForNavigation({ waitUntil: 'networkidle0' })

  /* Login if needed */
  await login(page, username, password)

  saveCookie(page, COOKIES_FILE_NAME)

  return { browser, page }
}

export async function scrapeAmazonProductDetails({ browser, page, asinArr, zipcodeArr }) {
  const productDetailsArray = []

  // Loop for scrappping products will be added here:

  for (let asin of asinArr) {
    // const pageUrl = page.url()
    // const newPageUrl = pageUrl.replace(/(?<=\/)([\w]{10})(?=\/)/, asin)
    // console.log(pageUrl, newPageUrl)
    await page.goto(`https://www.amazon.in/Keywest-Womens-Leather-Penguin-Handbag/dp/${asin}`, {
      waitUntilL: 'networkidle0'
    })

    /* Check if color present then extract */
    const productObj = await page.evaluate(scrapeAmazonPageData, asin)

    /* if zipcodes provided check delivery status for each zipcode */
    if (zipcodeArr) {
      for (let zipcode of zipcodeArr) {
        const DELIVERY_BUTTON_SELECTOR = `[id*="DeliveryBlock"] a`
        await page.waitForSelector(DELIVERY_BUTTON_SELECTOR)

        await page.click(DELIVERY_BUTTON_SELECTOR)

        /* wait for pincode input selector to load */
        const pincodeInput = await page.waitForSelector(`input[aria-label*="pincode"]`)
        await delay(1000)
        await page.keyboard.down('Control')
        await pincodeInput.press('A')
        await page.keyboard.up('Control')
        await pincodeInput.press('Backspace')
        await pincodeInput.type(zipcode)

        await page.click(`[id*="SpecifyLocation"] [type=submit]`)
        await delay(1000)
        await page.waitForResponse(
          (response) => response.url() === `https://aan.amazon.in/cem` && response.status() === 200
        )
        await page.waitForSelector(`[id*=DELIVERY_BLOCK] span`)

        const deliveryStatus = await page.$eval(
          `[id*=DELIVERY_BLOCK] span`,
          (deliveryBlockSpan) => {
            if (deliveryBlockSpan.dataset.csaCDeliveryTime) {
              return deliveryBlockSpan.dataset.csaCDeliveryTime
            } else {
              return deliveryBlockSpan.querySelector('span').innerText
            }
          }
        )

        productObj[zipcode] = deliveryStatus
        console.log({ zipcode, deliveryStatus })
      }
    }

    productDetailsArray.push(productObj)
  }

  console.log(productDetailsArray)

  saveCookie(page, COOKIES_FILE_NAME)
  // await browser.close()

  return productDetailsArray
}
