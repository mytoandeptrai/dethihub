import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AiDocumentPreview } from './ai-document-preview'

describe('document approval preview', () => {
  it('summarizes all payload fields including patches and nested block data', () => {
    render(
      <AiDocumentPreview
        document={{
          action: 'patch',
          patch: [{ target: 'header', value: { title: 'Trường THCS', time: 90, enabled: true } }],
          blocks: [{ type: 'image', src: '/diagram.png', alt: 'Hình vẽ' }],
        }}
      />,
    )
    const region = screen.getByRole('region', { name: 'Nội dung sẽ áp dụng' })
    for (const text of ['patch', 'header', 'Trường THCS', '90', 'true', '/diagram.png', 'Hình vẽ'])
      expect(region).toHaveTextContent(text)
  })

  it.each([{}, { blocks: [] }, { blocks: [null, 0, false] }])(
    'handles empty or unknown payload values without hiding approval content',
    (document) => {
      render(<AiDocumentPreview document={document} />)
      expect(screen.getByRole('region', { name: 'Nội dung sẽ áp dụng' })).toBeVisible()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    },
  )
})
