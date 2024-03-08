<script>
  import Versions from './components/Versions.svelte'
  import './app.css'

  let asin = 'B0C9HQT7TR'
  let zipcodes = ''
  let username = ''
  let password = ''

  let asinEanMappingArray = []
  let productDetailsArray = []
  const scrapeAmazonProductDetailsHandler = async (e) => {
    if (asin.length == 0) {
      displayToast('Please enter asins', 'error')
      return
    }
    let asinArr = []
    if (asin.length > 0) {
      asinArr = asin
        .trim()
        .split(/[,\s+]+/)
        .map((asin) => asin.trim())
    }

    let zipcodeArr = []
    if (zipcodes.length > 0) {
      zipcodeArr = zipcodes
        .trim()
        .split(/[,\s+]+/)
        .map((zipcode) => zipcode.trim())
    }
    let productDetailsArrayNew = await window.electron.ipcRenderer.invoke(
      'scrape-amazon-product-details',
      /* remove null */
      { asinArr, zipcodeArr: null, username, password }
    )

    displayToast(`Product details fetched for ${productDetailsArrayNew.length} asins`, 'success')

    productDetailsArray = [...productDetailsArray, ...productDetailsArrayNew]
  }

  const imageSelectHandler = (e, productDetailsIndex, imageLink) => {
    console.log(productDetailsIndex, imageLink)
    productDetailsArray[productDetailsIndex].selectedImageLink = imageLink
    console.log(productDetailsArray)
  }

  let toastQueue = []
  const displayToast = (message, type, resetTime = 3000) => {
    toastQueue = [...toastQueue, { message, type }]

    setTimeout(
      () => {
        toastQueue.shift()
        toastQueue = toastQueue
      },

      resetTime
    )
  }

  const exportAmazonProductDetailsToExcel = async () => {
    let { status, message } = await window.electron.ipcRenderer.invoke(
      'export-amazon-product-details-to-excel',
      // removing imageLinksArray from export data as only one link needs to be exported
      productDetailsArray.map(({ imageLinksArray, ...other }) => other)
    )

    displayToast(message, status)
  }

  const clearTableHandler = async () => {
    productDetailsArray = []
    displayToast('Product details cleared', 'error')
  }

  const deleteProductDetailsRowHandler = (e) => {
    productDetailsArray = productDetailsArray.toSpliced(
      e.currentTarget.dataset.productDetailsArrayIndex,
      1
    )
  }
</script>

<!-- Amazon Credentials  -->
<div class="container mx-auto mt-2">
  <div class="card bg-base-100 shadow-xl p-5">
    <p class="mb-3">Enter Amazon Login Credentials:</p>
    <!-- Login fields -->
    <div class="flex gap-2 items-center">
      <label class="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          class="w-4 h-4 opacity-70"
          ><path
            d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"
          /><path
            d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"
          /></svg
        >
        <input bind:value={username} type="text" class="grow" placeholder="Email" />
      </label>

      <label class="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          class="w-4 h-4 opacity-70"
          ><path
            fill-rule="evenodd"
            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
            clip-rule="evenodd"
          /></svg
        >
        <input type="password" class="grow" bind:value={password} />
      </label>
    </div>
    <div class="flex gap-2 items-end">
      <label class="form-control">
        <div class="label">
          <span class="label-text">Asins to Scrape:</span>
        </div>
        <textarea
          bind:value={asin}
          placeholder="Asin/s"
          class="textarea textarea-bordered textarea-xs w-full max-w-xs"
        />
      </label>
      <label class="form-control">
        <div class="label">
          <span class="label-text">Zipcodes to check for:</span>
        </div>
        <textarea
          bind:value={zipcodes}
          placeholder="Asin/s"
          class="textarea textarea-bordered textarea-xs w-full max-w-xs"
        />
      </label>
      <button class="btn btn-primary" on:click={scrapeAmazonProductDetailsHandler}
        >Scrape Amazon Product Details</button
      >
      {#if productDetailsArray.length > 0}
        <button class="btn btn-success" on:click={exportAmazonProductDetailsToExcel}
          >Export Amazon Product Details to Excel</button
        >
        <button class="btn btn-error" on:click={clearTableHandler}>Clear</button>
      {/if}
    </div>
  </div>
</div>

<!-- Scraped Amazon Data table -->
{#if productDetailsArray.length > 0}
  <div class="container mx-auto mt-4 overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th></th>
          <th>ASIN</th>
          <th>Brand</th>
          <th>Product Name</th>
          <th>Model</th>
          <th>MRP</th>
          <th>NLLC</th>
          <th>Bullet Points</th>
          <th>Images</th>
          <th>Rating</th>
          <th>Stock Status</th>
          <th>GST Status</th>
          <th>ASIN Mismatch</th>
        </tr>
      </thead>
      <tbody>
        {#each productDetailsArray as row, productDetailsIndex}
          <tr>
            <td
              ><button
                on:click={deleteProductDetailsRowHandler}
                data-product-details-array-index={productDetailsIndex}
                class="btn btn-error">X</button
              ></td
            >
            <td>{row.asin}</td>
            <td>{row.brandName}</td>
            <td>
              <p class="max-w-96 line-clamp-3 overflow-y-auto">
                {row.fullName}
              </p>
            </td>
            <td>{row.modelName}</td>
            <td>{row.mrp}</td>
            <td>{row.productSellingPrice}</td>
            <td>
              <p class="max-w-96 line-clamp-3 overflow-y-auto">
                {row.bulletPoints}
              </p>
            </td>
            <td>
              <div class="flex gap-1">
                {#each row.imageLinksArray as imageLink, imageLinkIndex}
                  <button
                    on:click={(e) => imageSelectHandler(e, productDetailsIndex, imageLink)}
                    onClick={`modal_${row.asin}_${imageLinkIndex}.showModal()`}
                    class={imageLink == row.selectedImageLink ? 'border-4 border-green-400' : ''}
                  >
                    <div class="avatar">
                      <div class="w-16 rounded">
                        <img src={imageLink} alt="product" />
                      </div>
                    </div>
                  </button>
                  <dialog id={`modal_${row.asin}_${imageLinkIndex}`} class="modal">
                    <div class="modal-box">
                      <img src={imageLink} alt="product" />
                    </div>
                    <form method="dialog" class="modal-backdrop">
                      <button>close</button>
                    </form>
                  </dialog>
                {/each}
              </div>
            </td>
            <td>{row.rating}</td>
            <td>{row.stockStatusMessage}</td>
            <td>{row.gstCreditAvailableStatus}</td>
            <td>{row['ASIN Mismatch']}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<!-- Toasts -->
<div class="toast">
  {#each toastQueue as { message, type }}
    <div
      class="alert"
      class:alert-error={type === 'error'}
      class:alert-info={type === 'info'}
      class:alert-success={type === 'success'}
    >
      <div>
        <span>{message}</span>
      </div>
    </div>
  {/each}
</div>

<!-- <Versions /> -->
