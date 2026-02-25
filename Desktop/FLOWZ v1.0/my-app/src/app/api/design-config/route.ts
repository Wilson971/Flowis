import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'src/lib/design-system/design-system-config.json')

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8')
    const config = JSON.parse(raw)
    return NextResponse.json(config)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({}, { status: 200 })
    }
    console.error('[design-config] GET error:', err)
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
  }

  try {
    const dir = path.dirname(CONFIG_PATH)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(CONFIG_PATH, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[design-config] POST error:', err)
    return NextResponse.json({ error: 'Failed to write config' }, { status: 500 })
  }
}
