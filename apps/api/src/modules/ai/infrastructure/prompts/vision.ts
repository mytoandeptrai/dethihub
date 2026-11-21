/** Fixed prompts: the vision endpoints never take a prompt from the client */
export const VISION_QUESTIONS_PROMPT = `Các ảnh sau là các trang liên tiếp của một đề thi tiếng Việt. Chép lại chính xác từng câu hỏi, không tự sáng tác, không sửa nội dung.
Chỉ trả về một JSON đúng dạng sau, không kèm giải thích:
{"questions":[{"number":1,"type":"trac-nghiem","prompt":"...","options":[{"key":"A","text":"..."}],"answer":"A","explanation":"","figure":{"page":1,"box":[x0,y0,x1,y1]}}],"answerKey":{"1":"A"}}
Quy tắc:
- type là một trong: trac-nghiem, dung-sai, tra-loi-ngan, tu-luan.
- prompt chỉ chứa đề bài, bỏ chữ "Câu N". Không đưa phương án hay đáp án vào prompt.
- Công thức toán viết LaTeX trong $...$.
- trac-nghiem: options có key A, B, C, D và answer là một chữ cái. dung-sai: options có key a, b, c, d và answer là chuỗi Đ/S theo thứ tự, ví dụ "ĐSĐS". tra-loi-ngan: answer là đáp số, không có options. tu-luan: không có options, lời giải (nếu có) đặt ở explanation.
- Chỉ điền answer khi trong đề thật sự có đáp án (bảng đáp án, phương án được đánh dấu). Không có thì để chuỗi rỗng, tuyệt đối không tự giải.
- Nếu các trang có bảng đáp án, ghi vào answerKey theo số câu, kể cả khi câu đó không nằm trong các trang này.
- figure: chỉ thêm khi câu có hình vẽ, biểu đồ, bảng dạng ảnh. page là số thứ tự ảnh gửi kèm tính từ 1, box là khung bao sát hình theo thang 0..1000 trên chiều rộng và chiều cao ảnh. Không có hình thì bỏ figure.
- Câu bị cắt ở mép trang, thiếu nội dung vẫn chép phần nhìn thấy.`

export const VISION_TEXT_PROMPT = `Các ảnh sau là các trang liên tiếp của một tài liệu tiếng Việt (thường là đề thi hoặc bài học). Chép lại toàn bộ chữ nhìn thấy, đúng thứ tự từ trên xuống, không tóm tắt, không sửa, không giải bài.
Công thức toán viết LaTeX trong $...$ (phân số, căn, vectơ, mũ, chỉ số, tích phân... đều chép đủ, không bỏ ký hiệu). Bảng số liệu viết dạng các dòng, ô cách nhau bằng " | ".
Mỗi hình vẽ (đồ thị, bảng biến thiên, hình không gian, sơ đồ, biểu đồ) chép tại đúng vị trí trong bài thành một khối [Hình: ...] mô tả đủ để vẽ lại: loại hình, các điểm / đỉnh có tên và vị trí tương đối, các nhãn và số ghi trên hình, điểm cực trị và giao điểm với trục (đồ thị), toàn bộ hàng x, y', y cùng mũi tên lên xuống (bảng biến thiên), các đoạn nét đứt, góc vuông, điểm trung điểm / chia tỉ lệ (hình học). Không đoán điều không nhìn thấy.
Bỏ đầu trang, chân trang, số trang lặp lại. Chỉ trả về phần chữ chép lại, không kèm lời dẫn.`
