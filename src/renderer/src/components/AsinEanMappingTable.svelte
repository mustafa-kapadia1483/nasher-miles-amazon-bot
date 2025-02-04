<script>
  import { utils, writeFileXLSX, write } from 'xlsx'

  export let asinEanMappingArray

  function exportFile() {
    try {
      const worksheet = utils.table_to_sheet(document.getElementById('asinTable'))

      // Loop through the worksheet and enforce string formatting
      for (const cellAddress in worksheet) {
        if (worksheet[cellAddress].t === 'n') {
          // Check if the cell contains a number
          worksheet[cellAddress].t = 's' // Change the type to string
          worksheet[cellAddress].v = worksheet[cellAddress].v.toString() // Convert the value to a string
        }
      }

      const wb = utils.book_new()
      utils.book_append_sheet(wb, worksheet, 'Sheet1')

      writeFileXLSX(wb, `asin-data.xlsx`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export file. Please try again.')
    }
  }
</script>

<div class="container mx-auto mt-4 overflow-x-auto">
  <table id="asinTable" class="table table-xs">
    <caption class="text-right">
      <button on:click={exportFile} class="btn btn-success">Export</button>
    </caption>
    <thead>
      <tr>
        <th>Sr.</th>
        <th>ASIN</th>
        <th>Message</th>
        <th>EAN</th>
        <th>HSN</th>
        <th>Tax Rate</th>
        <th>HSN description</th>
      </tr>
    </thead>
    <tbody>
      {#each asinEanMappingArray as row, index}
        <tr>
          <td>{index + 1}</td>
          <td>{row.asin}</td>
          <td>{row.message}</td>
          <td>{row.productData.ean ?? 'NA'}</td>
          <td>{row.productData.hsn.hsn ?? 'NA'}</td>
          <td>{row.productData.hsn.taxRate ?? 'NA'}</td>
          <td>{row.productData.hsn.description ?? 'NA'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
