<script>
  const versions = window.electron.process.versions
</script>

<div class="fixed bottom-2 right-4 text-xs z-0">
  <div class="flex flex-row justify-center w-full">
    <div class="grid place-items-center">
      Electron v{versions.electron}
    </div>
    <div class="divider divider-horizontal mx-0.5"></div>
    <div class="grid place-items-center">
      Chromium v{versions.chrome}
    </div>
    <div class="divider divider-horizontal mx-0.5"></div>
    <div class="grid place-items-center">
      Node v{versions.node}
    </div>
  </div>
</div>
