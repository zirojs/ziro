import { H3Event, readBody, readMultipartFormData } from 'h3'

export const parseBody = async (event: H3Event) => {
  const formData = await readMultipartFormData(event)
  if (formData) {
    try {
      const fields: any = {}
      for (const field of formData) {
        if (field.name && !field.filename) fields[field.name] = field.data.toString()
        if (field.name && field.filename) fields[field.name] = field
      }
      return fields
    } catch (err) {
      return null
    }
  } else {
    const jsonBody = await readBody(event)
    return jsonBody ?? null
  }
}
