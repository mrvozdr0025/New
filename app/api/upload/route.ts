import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentProfile } from "@/lib/session"

const MAX_SIZE = 4 * 1024 * 1024 // 4MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile || profile.isBanned) {
    return NextResponse.json({ error: "Giriş yapmalısın" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Sadece JPEG, PNG, WebP veya GIF yükleyebilirsin" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Dosya 4MB'dan büyük olamaz" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`yorumlar/${profile.id}-${Date.now()}.${ext}`, file, {
        access: "public",
      })
      return NextResponse.json({ url: blob.url })
    }

    // In-memory / Data URL fallback when Vercel Blob token is not configured
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`
    return NextResponse.json({ url: dataUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 })
  }
}
