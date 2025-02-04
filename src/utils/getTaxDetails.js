import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const schema = {
  responseMimeType: 'application/json',
  responseSchema: {
    description: 'HSN tax data',
    type: SchemaType.OBJECT,
    properties: {
      hsn: {
        type: SchemaType.STRING,
        description: 'Most accurate HSN of the product',
        nullable: false
      },
      taxRate: {
        description: 'taxRate for the corresponding HSN in number',
        type: SchemaType.NUMBER,
        nullable: false
      }
    },
    required: ['hsn', 'taxRate']
  }
}

export async function getTaxDetails(productData) {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: schema
  })

  const prompt = `HSN code in india for product name: ${productData.title}, brand name: ${productData.brand}, product group: ${productData.productGroup} & category: ${productData.category} using this JSON schema: 
  
  HsnData = { hsn: string, taxRate: number}
  Return: HsnData`

  console.log({ prompt })
  const result = await model.generateContent(prompt)

  return JSON.parse(result.response.text())
  // test with static output return { hsn: '95069990', taxRate: 18 }
}
