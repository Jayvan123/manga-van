import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for security (Vercel routes same-origin by default, but let's be secure)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { q } = req.query

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter q is required and must be a string' })
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Books API Key is not configured on the server.' })
  }

  try {
    const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q,
        key: apiKey,
        langRestrict: 'en',
        printType: 'books',
        orderBy: 'relevance',
        maxResults: 8,
      },
    })
    return res.status(200).json(response.data)
  } catch (error: any) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to fetch from Google Books API',
    })
  }
}
