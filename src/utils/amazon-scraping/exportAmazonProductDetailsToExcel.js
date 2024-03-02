import ExcelJS from 'exceljs'
import parseDate from '../parseDate'

export default async function exportAmazonProductDetailsToExcel(productDetailsArray) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Mustafa'
  workbook.lastModifiedBy = 'Mustafa'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.lastPrinted = new Date()

  const worksheet = workbook.addWorksheet('Product Details')
  worksheet.columns = [
    ...Object.keys(productDetailsArray[0]).map((key) => {
      return { header: key, key: key, width: 10 }
    })
  ]

  worksheet.addRows(productDetailsArray)

  const filename = parseDate('product-details-%y%m%d%M%S.xlsx')
  await workbook.xlsx.writeFile(filename)

  return {
    status: 'success',
    message: `${filename} created`
  }
}
