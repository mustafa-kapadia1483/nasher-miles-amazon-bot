export default function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}
