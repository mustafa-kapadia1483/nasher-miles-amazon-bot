<script>
  export let imageSelectHandler, row, imageLinkIndex, imageLink, productDetailsIndex
</script>

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
