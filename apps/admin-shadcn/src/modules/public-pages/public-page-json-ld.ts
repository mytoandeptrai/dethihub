import { site } from '@/config/site'
import { organizationJsonLd } from '@/lib/seo'
import { homeFaq } from '@/modules/public-pages/home-faq'

import type { components } from '@workspace/api-types'

export const softwareJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': site.name,
  'description': site.description,
  'url': site.url,
  'applicationCategory': 'EducationalApplication',
  'operatingSystem': 'Web',
  'offers': { '@type': 'Offer', 'price': 0, 'priceCurrency': 'VND' },
  'provider': { '@id': organizationJsonLd()['@id'] },
})

export const faqJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': homeFaq.map((item) => ({
    '@type': 'Question',
    'name': item.question,
    'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
  })),
})

export function pricingJsonLd(pricing: components['schemas']['PricingResponseDto'] | null) {
  if (!pricing || !Array.isArray(pricing.packs) || pricing.packs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    'name': 'Gói điểm AI Đề Thi Hub',
    'url': `${site.url}/pricing`,
    'itemListElement': pricing.packs.map((pack) => ({
      '@type': 'Offer',
      'price': pack.vnd,
      'priceCurrency': 'VND',
      'url': `${site.url}/pricing`,
      'itemOffered': {
        '@type': 'Product',
        'name': `Gói ${pack.vnd.toLocaleString('vi-VN')} ₫`,
        'description': `Gói điểm AI, thưởng ${Math.round(pack.bonus * 100)}% cho lần nạp đầu tiên của gói`,
        'brand': { '@type': 'Brand', 'name': site.name },
      },
    })),
  }
}

export const collectionJsonLd = (exams: components['schemas']['ExamCardDto'][]) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  'name': 'Đề cộng đồng',
  'url': `${site.url}/community`,
  'inLanguage': 'vi',
  'mainEntity': {
    '@type': 'ItemList',
    'numberOfItems': exams.length,
    'itemListElement': exams.map((exam, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': exam.title,
      'url': `${site.url}/exams/${encodeURIComponent(exam.id)}`,
    })),
  },
})
