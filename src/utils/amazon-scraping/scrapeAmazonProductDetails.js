import puppeteer from 'puppeteer'

import fs from 'fs'

async function login(page, username, password) {
  if ((await page.$(`[name="rememberMe"]`)) == null) {
    console.log('Already Logged in')
    return
  }

  await page.focus(`input[id*=email]`)
  await page.keyboard.type(username, { delay: 100 })

  await page.focus(`input[id*=password]`)
  await page.keyboard.type(password, { delay: 100 })

  /* Click remember me */
  await page.click(`[name="rememberMe"]`)

  await page.click('#signInSubmit')

  await page.waitForNavigation({ waitUntil: 'networkidle0' })

  const MFA_REMEMBER_CHECKBOX_SELECTOR = `[id="auth-mfa-remember-device"]`
  if (page.$(MFA_REMEMBER_CHECKBOX_SELECTOR)) {
    page.click(MFA_REMEMBER_CHECKBOX_SELECTOR)
    /* Wait for OTP to be entered & page to be reloaded */
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 50_000 })
  }
}

console.log({ __dirname })

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
async function scrapeAmazonPageData() {
  /* delay */
  function delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time)
    })
  }
  let fullName = document.querySelector(`[id^=title] h1`).textContent.trim()

  let brandName = ''
  const brandNameElementOption1 = document.querySelector(`[class*=po-brand]`)
  if (brandNameElementOption1) {
    brandName = brandNameElementOption1.textContent
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

  const mrp = document
    .querySelector(`[id*="PriceLegalMessage"]`)
    .parentElement.querySelector(`[class*=price] span`)
    .textContent.trim()
    .replaceAll(/[^\d.]/gm, '')

  const productSellingPrice = document
    .querySelector(`.priceblock_vat_inc_price [class*=price] span`)
    .textContent.trim()
    .replaceAll(/[^\d.]/gm, '')

  let modelName = ''
  /* Product details */
  for (let li of document.querySelectorAll(
    `[id*=detailBulletsWrapper] [id*="detailBullets"] ul li`
  )) {
    let [key, value] = li
      .querySelector('span')
      .textContent.split(':')
      .map((text) => text.trim().replaceAll(/\s\s+/g, ''))

    key = key.toLowerCase()
    if (key.includes('model number') || key.includes('part number')) {
      modelName = value
    }
  }

  let bulletPoints = ''
  for (let bulletPoint of document.querySelectorAll('.product-facts-title ~ ul')) {
    bulletPoints += `${bulletPoint.textContent.trim()}\n`
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

    bulletPoints = productDescriptionDiv.textContent.replace(/\s\s+/g, '').trim()
  }

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

  imageLinksArray = []
  imageBlockElement = document.querySelector(`[id="imageBlock"] `)
  if (imageBlockElement) {
    for (let img of imageBlockElement.querySelectorAll(`img`)) {
      dispatchMouseEvents(img)
      await delay(100)
    }
    for (let img of imageBlockElement.querySelectorAll(`img[class*= a-stretc]`)) {
      imageLinksArray.push(img.src)
    }
  }

  const rating = document.querySelector('#averageCustomerReviews a span').textContent.trim()

  let stockStatusMessage = ''
  const stockStatusMessageElement = document.querySelector(`[id="availability"]`)

  if (stockStatusMessageElement) {
    stockStatusMessage = stockStatusMessageElement.textContent.trim()
  }

  let gstCreditAvailableStatus = 'TRUE'
  const gstExcludedPriceElement = document.querySelector(`[class*=priceblock_vat_excl]`)
  if (gstExcludedPriceElement) {
    text = gstExcludedPriceElement.textContent
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
    rating,
    stockStatusMessage,
    gstCreditAvailableStatus
  }
}

export default async function scrapeAmazonProductDetails({ username, password, asin }) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  })
  const page = await browser.newPage()

  const COOKIES_FILE_NAME = 'amazon-cookies'

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

  await page.click(`[id^="B"] .a-link-normal`)

  const productDetailsArray = []

  // Loop for scrappping products will be added here:

  const pageUrl = page.url()
  const newPageUrl = pageUrl.replace(/(?<=\/)([\w]{10})(?=\/)/, asin)
  console.log(pageUrl, newPageUrl)
  page.goto(newPageUrl)

  /* Check if color present then extract */
  await page.waitForSelector(`[id*=detailBulletsWrapper] [id*="detailBullets"] ul li`)
  const productObj = await page.evaluate(scrapeAmazonPageData)
  productObj['asin'] = asin

  productDetailsArray.push(productObj)

  console.log(productDetailsArray)

  // await browser.close()
}
