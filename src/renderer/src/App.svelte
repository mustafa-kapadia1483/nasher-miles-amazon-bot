<script>
  import Versions from './components/Versions.svelte'
  import './app.css'

  let asin = 'B0C9HQT7TR'
  let username = ''
  let password = ''
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
        .split(/[,\s+]/)
        .map((asin) => asin.trim())
    }

    e.target.disbaled = true

    let productDetailsArrayNew = await window.electron.ipcRenderer.invoke(
      'scrape-amazon-product-details',
      { asinArr, username, password }
    )

    displayToast(`Product details fetched for ${productDetailsArrayNew.length} asins`, 'success')

    e.target.disbaled = false

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
</script>

<!-- Amazon Credentials  -->
<div class="container mx-auto mt-2">
  <div class="card bg-base-100 shadow-xl p-5">
    <p class="mb-3">Enter Amazon Login Credentials:</p>
    <div class="flex gap-2 items-end">
      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Email:</span>
        </div>
        <input
          bind:value={username}
          type="text"
          placeholder="Type here"
          class="input input-bordered w-full max-w-xs"
        />
      </label>

      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text">Password:</span>
        </div>
        <input
          bind:value={password}
          type="password"
          placeholder="Type here"
          class="input input-bordered w-full max-w-xs"
        />
      </label>

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

<!-- Scraped Data table -->
{#if productDetailsArray.length > 0}
  <div class="container mx-auto">
    <table class="table mt-4">
      <thead>
        <tr>
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
        </tr>
      </thead>
      <tbody>
        {#each productDetailsArray as row, productDetailsIndex}
          <tr>
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
