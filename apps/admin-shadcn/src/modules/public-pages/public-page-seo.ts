import { buildMetadata } from '@/lib/seo'

export const publicPages = {
  home: {
    path: '/',
    title: 'Đề Thi Hub – Soạn đề thi, đề online và slide bài giảng bằng AI',
    absoluteTitle: true,
    description:
      'Soạn đề thi, tạo đề online và thiết kế slide bài giảng bằng AI cùng Đề Thi Hub. Công cụ dành cho giáo viên giúp tiết kiệm thời gian, chia sẻ tài liệu dễ dàng.',
  },
  pricing: {
    path: '/pricing',
    title: 'Bảng giá và gói điểm AI cho giáo viên',
    description:
      'Khám phá bảng giá Đề Thi Hub và các gói điểm AI linh hoạt cho giáo viên. Bắt đầu miễn phí, chọn gói phù hợp để soạn đề, tạo slide và nâng cao hiệu quả dạy học.',
    image: { url: '/pricing/opengraph-image', alt: 'Bảng giá Đề Thi Hub' },
  },
  community: {
    path: '/community',
    title: 'Đề cộng đồng – Thư viện đề thi chia sẻ',
    description:
      'Tìm đề thi theo môn học và lớp trong thư viện cộng đồng Đề Thi Hub. Xem trước câu hỏi, luyện tập trực tuyến và chia sẻ đề chất lượng cùng giáo viên cả nước.',
    image: { url: '/community/opengraph-image', alt: 'Đề cộng đồng Đề Thi Hub' },
  },
  terms: {
    path: '/terms',
    title: 'Điều khoản sử dụng',
    description:
      'Tìm hiểu điều khoản sử dụng Đề Thi Hub: quyền và trách nhiệm của người dùng, quy định chia sẻ tài liệu, nội dung AI và nguyên tắc sử dụng nền tảng giáo dục.',
  },
  privacy: {
    path: '/privacy',
    title: 'Chính sách bảo mật',
    description:
      'Đọc chính sách bảo mật của Đề Thi Hub để biết cách thông tin tài khoản, tài liệu và dữ liệu sử dụng được xử lý, bảo vệ cùng các quyền riêng tư của giáo viên.',
  },
}

export const publicPageMetadata = (page: keyof typeof publicPages) =>
  buildMetadata(publicPages[page])
