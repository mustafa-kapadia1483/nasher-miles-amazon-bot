<script>
  import ImageChooser from './ImageChooser.svelte'
  export let productDetailsArray

  const deleteProductDetailsRowHandler = (e) => {
    productDetailsArray = productDetailsArray.toSpliced(
      e.currentTarget.dataset.productDetailsArrayIndex,
      1
    )
  }

  const imageSelectHandler = (e, productDetailsIndex, imageLink) => {
    console.log(productDetailsIndex, imageLink)
    productDetailsArray[productDetailsIndex].selectedImageLink = imageLink
    console.log(productDetailsArray)
  }
</script>

<div class="container mx-auto my-10 overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th></th>
        <th>Sr.</th>
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
          <td>
            <button
              on:click={deleteProductDetailsRowHandler}
              data-product-details-array-index={productDetailsIndex}
              class="btn btn-circle btn-error btn-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                /></svg
              >
            </button></td
          >
          <td>{productDetailsIndex + 1}</td>
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
                <ImageChooser
                  {row}
                  {imageSelectHandler}
                  {imageLink}
                  {imageLinkIndex}
                  {productDetailsIndex}
                />
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
