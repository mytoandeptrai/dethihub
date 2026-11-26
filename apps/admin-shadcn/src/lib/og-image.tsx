/* oxlint-disable nextjs/no-img-element -- ImageResponse renders native image elements. */
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { ImageResponse } from 'next/og'

import { site } from '@/config/site'

export async function createOgImage({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  const [regular, bold, mark] = await Promise.all([
    readFile(path.join(process.cwd(), 'src/assets/fonts/be-vietnam-pro-400.ttf')),
    readFile(path.join(process.cwd(), 'src/assets/fonts/be-vietnam-pro-700.ttf')),
    readFile(path.join(process.cwd(), 'public/brand/favicon.svg')),
  ])
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 72,
        background: 'linear-gradient(135deg, #312e81, #4f46e5 60%, #818cf8)',
        color: 'white',
        fontFamily: 'Be Vietnam Pro',
        fontWeight: 700,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <img
          src={`data:image/svg+xml;base64,${mark.toString('base64')}`}
          width={112}
          height={112}
          alt=""
        />
        <span style={{ fontSize: 28 }}>DẠY HỌC THÔNG MINH HƠN</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            fontSize: title.length > 65 ? 48 : title.length > 30 ? 62 : 82,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {description ? (
          <div style={{ fontSize: 32, fontWeight: 400, lineHeight: 1.5, maxWidth: 1020 }}>
            {description}
          </div>
        ) : null}
      </div>
      <div style={{ fontSize: 24 }}>{new URL(site.url).host}</div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Be Vietnam Pro', data: regular, weight: 400, style: 'normal' },
        { name: 'Be Vietnam Pro', data: bold, weight: 700, style: 'normal' },
      ],
    },
  )
}
