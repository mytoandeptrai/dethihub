export const draftPreviewFixture = {
  action: 'replace',
  name: 'Ôn tập hệ thức lượng — Toán 9',
  say: 'Bản nháp đã sẵn sàng để thầy/cô duyệt.',
  blocks: [
    {
      type: 'header',
      left: 'TRƯỜNG THCS ĐỀ THI HUB\nTỔ TOÁN — TIN',
      right: 'ĐỀ ÔN TẬP TOÁN 9\nThời gian: 45 phút',
    },
    { type: 'student', text: 'Họ và tên: ………………………………  Lớp: …………' },
    {
      type: 'question',
      no: 1,
      text: 'Tam giác ABC vuông tại A, AB = 6 cm, AC = 8 cm. Tính BC.',
      options: [
        { label: 'A', text: '6 cm' },
        { label: 'B', text: '7 cm' },
        { label: 'C', text: '8 cm' },
        { label: 'D', text: '10 cm' },
      ],
    },
    {
      type: 'question',
      kind: 'short',
      no: 2,
      text: 'Cho $AH^2 = BH \\cdot CH$, BH = 9 và CH = 16. Tính AH.',
      options: [],
    },
    {
      type: 'answerKey',
      items: [
        { no: 1, answer: 'D' },
        { no: 2, answer: '12' },
      ],
    },
    { type: 'divider' },
    {
      type: 'paragraph',
      text: 'Gợi ý: áp dụng định lý Pythagore và hệ thức lượng trong tam giác vuông.',
    },
  ],
}
