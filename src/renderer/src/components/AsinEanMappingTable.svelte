<script>
  export let asinEanMappingArray
</script>

<div class="container mx-auto mt-4 overflow-x-auto">
  <table class="table table-xs">
    <thead>
      <tr>
        <th>Sr.</th>
        <th>ASIN</th>
        <th>EAN</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
      {#each asinEanMappingArray as row, index}
        <tr>
          <td>{index + 1}</td>
          <td>{row.asin}</td>
          <td>{row.ean}</td>
          <td>{row.message}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
