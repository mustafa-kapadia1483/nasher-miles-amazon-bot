import ExcelJS from 'exceljs'
import parseDate from './parseDate'

export default async function exportAsinEanMapping(asinEanMappingArray) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Mustafa'
  workbook.lastModifiedBy = 'Mustafa'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.lastPrinted = new Date()

  const worksheet = workbook.addWorksheet('ASIN EAN Mapping')
  worksheet.columns = [
    ...Object.keys(asinEanMappingArray[0]).map((key) => {
      return { header: key, key: key, width: 10 }
    })
  ]

  worksheet.addRows(asinEanMappingArray)

  const filename = parseDate('asin-ean-mapping-%y%m%d%M%S.xlsx')
  await workbook.xlsx.writeFile(filename)

  return {
    status: 'success',
    message: `${filename} created`
  }
}
