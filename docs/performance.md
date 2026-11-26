# Hướng dẫn Performance cho Đề Thi Hub

Tài liệu này giải thích cách **đo**, **đọc kết quả** và **giữ hiệu năng** cho https://dethihub.vercel.app.

---

## 1. Các chỉ số cần biết (Core Web Vitals)

| Chỉ số | Ý nghĩa dễ hiểu | Tốt | Cần cải thiện | Kém |
|---|---|---|---|---|
| **LCP** – Largest Contentful Paint | Bao lâu thì nội dung lớn nhất (tiêu đề, ảnh chính) hiện ra | ≤ 2.5s | 2.5–4s | > 4s |
| **INP** – Interaction to Next Paint | Bấm nút/gõ phím thì bao lâu giao diện phản hồi | ≤ 200ms | 200–500ms | > 500ms |
| **CLS** – Cumulative Layout Shift | Trang có bị "nhảy" bố cục khi đang tải không | ≤ 0.1 | 0.1–0.25 | > 0.25 |
| **FCP** – First Contentful Paint | Bao lâu thì thấy *bất kỳ* nội dung nào | ≤ 1.8s | 1.8–3s | > 3s |
| **TBT** – Total Blocking Time | Tổng thời gian JS chặn trình duyệt khi tải (đo trong lab, thay cho INP) | ≤ 200ms | 200–600ms | > 600ms |
| **TTFB** – Time To First Byte | Server trả byte đầu tiên nhanh cỡ nào | ≤ 0.8s | 0.8–1.8s | > 1.8s |

> Google xếp hạng theo **LCP, INP, CLS** đo từ người dùng thật (field data). Điểm Lighthouse (0–100) chỉ là điểm **lab**, dùng để so sánh trước/sau.

**Lab data vs Field data**
- **Lab** (Lighthouse, DevTools): đo trên một máy, một mạng giả lập. Dễ lặp lại, dùng khi đang code.
- **Field** (CrUX, Vercel Speed Insights): số liệu từ người dùng thật trong 28 ngày. Đây mới là thứ Google dùng.

---

## 2. Cách đo – từng công cụ, xem ở đâu

### 2.1. PageSpeed Insights (nhanh nhất, không cần cài gì)
1. Mở https://pagespeed.web.dev
2. Dán URL, ví dụ `https://dethihub.vercel.app/pricing`, bấm **Analyze**.
3. Đọc kết quả:
   - **Phần trên – "Discover what your real users are experiencing"**: field data (chỉ có khi site đủ lượt truy cập; site mới thường báo "No Data").
   - **Phần dưới – "Diagnose performance issues"**: điểm Lighthouse lab cho **Mobile** và **Desktop** (chuyển tab ở góc trên).
   - Kéo xuống **Diagnostics / Opportunities** để xem lý do tụt điểm (JS thừa, ảnh lớn, render-blocking…).
4. Luôn xem tab **Mobile** trước – Google index theo mobile.

### 2.2. Lighthouse trong Chrome DevTools
1. Mở trang bằng Chrome **ở cửa sổ ẩn danh** (Ctrl+Shift+N) để extension không làm sai số.
2. `F12` → tab **Lighthouse**.
3. Chọn **Mode: Navigation**, **Device: Mobile**, tick **Performance** (và SEO, Accessibility, Best Practices nếu muốn).
4. Bấm **Analyze page load**.
5. Đọc:
   - Điểm tổng và 5 chỉ số FCP, LCP, TBT, CLS, Speed Index.
   - **View Treemap**: xem file JS nào to, bao nhiêu % không dùng.
   - Mục **LCP element**: phần tử nào là LCP và thời gian bị mất ở đâu (TTFB, load delay, render delay).

### 2.3. Lighthouse bằng dòng lệnh (để so sánh trước/sau)
```bash
# Đo trang production
npx lighthouse https://dethihub.vercel.app/ --only-categories=performance \
  --form-factor=mobile --output=html --output-path=./lh-home.html --view

# Đo bản build local
pnpm --filter admin-shadcn build
pnpm --filter admin-shadcn start   # mặc định http://localhost:3000
npx lighthouse http://localhost:3000/pricing --output=json --output-path=./lh-pricing.json
```
Mẹo: chạy **3 lần, lấy trung vị** – điểm Lighthouse dao động ±5.

### 2.4. Tab Performance trong DevTools (tìm nguyên nhân sâu)
1. `F12` → **Performance** → bật **CPU: 4x slowdown**, **Network: Fast 4G**.
2. Bấm nút **Reload** (vòng tròn) để ghi lại quá trình tải.
3. Xem:
   - **Main** track: các khối màu vàng dài (> 50ms, có tam giác đỏ) là **long task** → gây TBT/INP cao. Click vào để thấy hàm/file nào.
   - **Timings**: mốc FCP, LCP.
   - **Bottom-Up**: hàm nào tốn thời gian nhất.
4. Đo **INP**: bấm Record, thao tác (mở menu, bấm nút…), dừng và xem **Interactions**.

### 2.5. Tab Network và Coverage
- **Network**: lọc `JS`, sắp theo **Size** để thấy file nặng; kiểm tra font/ảnh có tải thừa không; xem request API nào chặn hiển thị.
- **Coverage** (`Ctrl+Shift+P` → "Show Coverage"): bao nhiêu % code của mỗi file JS/CSS thực sự chạy.

### 2.6. Vercel Speed Insights (field data của người dùng thật)
1. Vercel Dashboard → project **dethihub** → tab **Speed Insights** → **Enable**.
2. Cài package: `pnpm --filter admin-shadcn add @vercel/speed-insights` rồi thêm `<SpeedInsights />` vào `app/layout.tsx`.
3. Sau khi có traffic, xem LCP/INP/CLS theo từng route, theo thiết bị, phân vị P75.

> Hiện dự án **chưa bật** Speed Insights; đây là bước nên làm tiếp.

### 2.7. Google Search Console → Core Web Vitals
Sau khi thêm site vào Search Console: **Experience → Core Web Vitals** sẽ báo nhóm URL "Good / Needs improvement / Poor" theo dữ liệu thật của Chrome.

### 2.8. Phân tích bundle trong dự án
```bash
# Xem cây module trong từng bundle (Next 16 built-in analyzer)
pnpm --filter admin-shadcn analyze

# Kiểm tra JS ban đầu của trang không vượt ngân sách
pnpm --filter admin-shadcn build
pnpm --filter admin-shadcn start --port 8092 &   # chạy ở terminal riêng
pnpm --filter admin-shadcn check:bundle
```
- Ngân sách nằm ở `apps/admin-shadcn/scripts/bundle-budget.json` (≈ 110% so với lần đo cuối).
- Nếu `check:bundle` báo **FAIL**: xem analyzer để biết module mới nào bị kéo vào trang public.

---

## 3. Quy trình kiểm tra khi có thay đổi

1. **Trước khi sửa**: đo Lighthouse mobile cho trang liên quan (3 lần, lấy trung vị), lưu lại số.
2. Sửa code.
3. `pnpm build` + `pnpm start`, đo lại đúng các trang đó với cùng cấu hình.
4. Chạy `check:bundle` cho `/`, `/pricing`, `/community`.
5. Ghi bảng trước/sau vào mô tả PR.
6. Sau khi deploy: đo lại bằng PageSpeed Insights trên domain thật.

Kết quả hiện tại (Lighthouse mobile, máy local):

| Trang | Performance | LCP | TBT | JS tải về |
|---|---:|---:|---:|---:|
| `/` | 83 → 92 | 1.4s | 665 → 340ms | 919KB → 585KB |
| `/pricing` | 65 → 74 | 6.9 → 5.3s | 478 → 300ms | 664KB → 481KB |
| `/community` | 54 → 67 | 9.5 → 8.1s | 939 → 373ms | 2.2MB → 810KB |
| Trang đề | 76 → 86 | 1.4s | 1175 → 536ms | 2.2MB → 1.0MB |

Kết quả **trên site thật** (PageSpeed Insights, mobile, đo sau khi deploy commit `f704542`):

| Trang | Performance | FCP | LCP | TBT | CLS | Speed Index | A11y / BP / SEO |
|---|---:|---:|---:|---:|---:|---:|---|
| `/` | **98** | 1.2s | 1.2s | 90ms | 0 | 4.0s | 100 / 100 / 100 |
| `/pricing` | **92** | 1.2s | 3.3s | 0ms | 0 | 1.2s | 100 / 100 / 100 |
| `/community` | **75** | 1.2s | **6.3s** | 0ms | 0.004 | 4.2s | 100 / 100 / 100 |

→ Việc tiếp theo nên làm: giảm LCP của `/community` (xem mục 6.3).

---

## 4. Best practices (áp dụng cho dự án này)

### JavaScript
- **Server Component mặc định**; chỉ thêm `'use client'` khi thật sự cần state, effect hoặc API trình duyệt.
- **Không import code nặng vào khung chung** (`provide.tsx`, shell, layout). KaTeX, TipTap, thư viện vẽ hình, hình mẫu… chỉ load trong `/editor` hoặc qua `next/dynamic` / `import()`.
- **Tránh barrel file** (`index.ts` re-export mọi thứ): import thẳng đường dẫn cụ thể để bundler không kéo cả module.
- Chia nhỏ việc nặng, dùng `requestIdleCallback`/`useEffect` hoãn việc không gấp (sync, presence, analytics).
- Kiểm tra bằng analyzer mỗi khi thêm thư viện mới.

### Dữ liệu
- **Lấy dữ liệu trên server** và truyền vào client làm `initialData` (React Query) – đừng để trang trắng chờ client gọi API.
- Dùng `cache()` để `generateMetadata` và page dùng chung một request.
- Đặt `revalidate` hợp lý cho dữ liệu public (ví dụ 300–3600s).
- Có timeout cho fetch phía server để API chậm không kéo cả trang.

### Điều hướng
- Link tới trang riêng tư/nặng (`/editor`, `/admin`, `/my-docs`…) dùng `prefetch={false}` (đã có `navigation-link.tsx`).
- Không bọc `loading.tsx` quá rộng nếu cần trả status 404 thật cho SEO.

### Font
- Chỉ dùng số độ đậm thật sự cần (hiện tại 400/600/700), chỉ subset `vietnamese` + `latin`.
- `display: swap`, self-host qua `next/font` hoặc file local; preload font chính.

### Ảnh
- Dùng `next/image`, luôn có `width`/`height` (tránh CLS).
- Ảnh LCP (logo/hero) đặt `priority`; ảnh dưới màn hình để lazy.
- Ưu tiên SVG cho icon, WebP/AVIF cho ảnh chụp.

### CSS & bố cục
- Đặt kích thước cố định cho khung chứa nội dung tải sau (skeleton cùng kích thước) để CLS ≈ 0.
- Tránh CSS lớn chỉ dùng cho editor bị nạp ở trang marketing.

### Theo dõi lâu dài
- Bật **Vercel Speed Insights** để có số liệu người dùng thật.
- Giữ `check:bundle` xanh; nâng ngân sách chỉ khi có lý do rõ ràng và ghi vào PR.
- Đo lại sau mỗi tính năng lớn ở trang public.

---

## 5. Checklist nhanh trước khi merge

- [ ] Lighthouse mobile của trang bị ảnh hưởng không tụt quá 5 điểm.
- [ ] `check:bundle` PASS.
- [ ] Không có import mới từ `engine/` vào provider/shell/marketing.
- [ ] Dữ liệu chính của trang public render từ server.
- [ ] Ảnh mới có kích thước, font mới có subset.
- [ ] CLS ≈ 0 (không có nhảy bố cục khi tải).


---

## 6. Đọc báo cáo Lighthouse/PageSpeed thật chi tiết

### 6.1. Thứ tự đọc một báo cáo
1. **Điểm tổng** (vòng tròn): 90–100 xanh, 50–89 cam, 0–49 đỏ. Điểm là trung bình có trọng số:
   TBT 30%, LCP 25%, CLS 25%, FCP 10%, Speed Index 10%. → **TBT, LCP, CLS quyết định 80% điểm.**
2. **Metrics**: chỉ số nào đỏ/cam thì tập trung vào chỉ số đó.
3. **Ảnh filmstrip** (dãy ảnh nhỏ): xem trang "trắng" bao lâu, nội dung chính hiện ở khung nào.
4. **Show audits relevant to: LCP / TBT / CLS**: bấm vào chỉ số đang đỏ để lọc đúng các gợi ý liên quan.
5. **Insights / Diagnostics**: mở từng mục, đọc cột *Est savings* (ước tính tiết kiệm) – ưu tiên mục tiết kiệm nhiều nhất.
6. **View Treemap**: hình ô vuông, ô càng to là file JS càng nặng; phần tô đỏ là code không dùng.

### 6.2. Các mục Insights hay gặp và cách sửa trong dự án

| Mục trong báo cáo | Nghĩa là gì | Cách sửa trong Đề Thi Hub |
|---|---|---|
| **LCP breakdown** (TTFB / Load delay / Load time / Render delay) | LCP chậm ở giai đoạn nào | TTFB cao → server/API chậm, thêm cache `revalidate`; Render delay cao → JS chặn, nội dung phải chờ client render |
| **Reduce unused JavaScript** | Tải JS nhưng không chạy | `next/dynamic`, bỏ import từ barrel, không đưa `engine/` vào shell |
| **Render-blocking requests** | CSS/JS chặn vẽ trang | CSS editor (`product.css`, KaTeX CSS) chỉ nạp ở route cần |
| **Network dependency tree** | Request nối đuôi nhau | Lấy dữ liệu ở server, preload font/ảnh LCP |
| **Font display** | Chữ bị ẩn khi font chưa tải | `display: swap` (đã làm) |
| **Improve image delivery** | Ảnh quá to / sai định dạng | `next/image`, WebP/AVIF, đúng kích thước hiển thị |
| **Layout shift culprits** | Phần tử nào gây nhảy bố cục | Đặt `width/height`, skeleton cùng kích thước nội dung thật |
| **Minimize main-thread work** / **Reduce JS execution time** | JS chạy quá lâu | Hoãn khởi tạo không cần thiết, chia nhỏ component client |
| **Avoid long main-thread tasks** | Có tác vụ > 50ms | Profile ở tab Performance, tách việc nặng ra `requestIdleCallback` |
| **Legacy JavaScript** | Polyfill cho trình duyệt cũ | Kiểm tra `browserslist`, tránh thư viện kèm polyfill lớn |

### 6.3. Ví dụ phân tích: vì sao `/community` có LCP 6.3s
- FCP chỉ 1.2s và TBT = 0 → JS **không** còn là vấn đề chính.
- LCP chậm hơn FCP tới 5s → phần tử LCP (thẻ đề đầu tiên/tiêu đề danh sách) xuất hiện **muộn**.
- Nguyên nhân thường gặp: dữ liệu đề hiện sau khi client gọi lại API, thẻ đề render công thức/ảnh chậm, hoặc phần tử LCP là chữ trong khối chỉ hiện sau khi font/dữ liệu xong.
- Cách kiểm tra: PageSpeed → lọc **LCP** → mở **LCP breakdown** xem phần nào chiếm nhiều nhất; DevTools Performance → mốc **LCP** → click để biết đúng phần tử.
- Hướng sửa: render sẵn danh sách đề từ server (HTML có sẵn, không đợi hydrate), giảm số thẻ ở màn đầu, dùng skeleton đúng kích thước, bỏ render KaTeX trong thẻ preview.

---

## 7. Hướng dẫn từng bước dùng DevTools Performance (chi tiết)

1. Mở `https://dethihub.vercel.app/community` trong cửa sổ ẩn danh.
2. `F12` → tab **Performance**.
3. Bấm biểu tượng bánh răng (⚙): **CPU: 4x slowdown**, **Network: Fast 4G** (gần giống máy Android tầm trung).
4. Bấm **Record and reload** (biểu tượng ↻).
5. Khi xong, giao diện có các phần:
   - **Timeline phía trên**: đồ thị CPU (màu vàng = JS, tím = layout/style, xanh = vẽ).
   - **Network track**: thứ tự tải file; file nào nằm trước mốc LCP là file "chặn" LCP.
   - **Timings**: các mốc FCP, LCP, DCL, L.
   - **Main**: biểu đồ ngọn lửa (flame chart). Khối có **góc đỏ** là long task.
6. Click một long task → tab **Summary/Bottom-Up** bên dưới cho biết hàm và file gây chậm (ví dụ `chunks/xxxx.js` → tra tên module bằng `pnpm --filter admin-shadcn analyze`).
7. Đo tương tác (INP): bấm **Record** (không reload), click vào nút/menu cần đo, dừng → track **Interactions** hiển thị thời gian từng lần bấm.

**Live metrics** (mặc định khi mở tab Performance): hiển thị LCP/CLS/INP thời gian thực khi bạn thao tác – tiện để test nhanh khi đang dev.

---

## 8. Lỗi đo hay gặp (và cách tránh)

| Vấn đề | Cách xử lý |
|---|---|
| Điểm mỗi lần đo một khác | Đo 3–5 lần lấy trung vị; đóng tab/ứng dụng nặng khác |
| Đo bằng `pnpm dev` ra điểm rất thấp | Dev mode không tối ưu – **luôn đo bản `build` + `start`** hoặc site đã deploy |
| Extension Chrome làm sai số | Dùng cửa sổ ẩn danh hoặc profile Chrome trống |
| Trang đăng nhập bị chuyển hướng | Lighthouse đo trạng thái khách; trang riêng tư cần đo bằng DevTools khi đã đăng nhập |
| Lần đầu sau deploy chậm | Vercel "cold start" + cache trống; đo lại lần 2 |
| API local không chạy | Trang lấy dữ liệu server sẽ timeout → LCP sai lệch; bật API hoặc đo trên site thật |
| PageSpeed "No Data" ở phần real users | Bình thường với site mới/ít truy cập; cần thời gian để Chrome UX Report có dữ liệu |

---

## 9. Kiến trúc hiệu năng hiện tại của dự án (để không làm hỏng)

- **Trang public** (`/`, `/pricing`, `/community` khi chưa đăng nhập, `/exams/[id]`, `/terms`, `/privacy`) dùng khung marketing nhẹ.
- **Trang app** (`/my-docs`, `/editor`, `/admin`, …) dùng khung app đầy đủ (sidebar, workspace sync).
- `src/components/navigation-link.tsx`: link tắt prefetch cho route riêng tư – **dùng component này** thay cho `next/link` khi link tới trang riêng tư.
- `engine/components/lazy-math-text.tsx`, `lazy-question-body.tsx`: chỉ tải KaTeX khi nội dung thật sự có công thức.
- `src/i18n/**`: bản dịch chia theo phạm vi, chỉ gửi xuống client phần cần.
- `/pricing`, `/community`: dữ liệu lấy ở server rồi truyền vào React Query làm `initialData`.
- Font marketing: Be Vietnam Pro 400/600/700 × vietnamese/latin; font tài liệu/editor giữ nguyên để không lệch khổ A4.
- `scripts/check-bundle-size.mjs` + `bundle-budget.json`: ngân sách JS cho trang public.

**Những thứ không được làm** (sẽ kéo JS editor vào trang public):
- Import bất kỳ thứ gì từ `src/engine/**` trong `provide.tsx`, shell, layout marketing.
- Import qua barrel `@/modules/xxx` khi chỉ cần một hàm nhỏ – import thẳng file.
- Dùng `next/link` thường cho `/editor`, `/admin`… ở trang public.
- Đặt `loading.tsx` bao quanh trang cần trả 404 thật.

---

## 10. Câu hỏi thường gặp

**Điểm Lighthouse có ảnh hưởng trực tiếp tới thứ hạng Google không?**
Không trực tiếp. Google dùng **Core Web Vitals từ người dùng thật** (LCP, INP, CLS). Điểm Lighthouse là công cụ để cải thiện các chỉ số đó.

**Mobile hay desktop quan trọng hơn?**
Mobile. Google index theo mobile, và mobile luôn khó hơn (CPU yếu, mạng chậm).

**Bao nhiêu điểm là đủ?**
≥ 90 là tốt. Quan trọng hơn: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 ở phân vị 75 của người dùng thật.

**Có nên đuổi theo 100 điểm?**
Không cần. Từ 90 lên 100 thường tốn nhiều công mà người dùng không cảm nhận được. Ưu tiên sửa chỉ số đỏ.

**Khi nào cần đo lại?**
Sau mỗi tính năng ở trang public, khi thêm thư viện mới, và định kỳ hàng tháng.

---

## 11. Tài liệu tham khảo
- Core Web Vitals: https://web.dev/articles/vitals
- Cách tính điểm Lighthouse: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
- Lighthouse scoring calculator: https://googlechrome.github.io/lighthouse/scorecalc/
- DevTools Performance: https://developer.chrome.com/docs/devtools/performance
- Next.js – Optimizing: https://nextjs.org/docs/app/guides (mục Lazy Loading, Fonts, Images, Package Bundling)
- Vercel Speed Insights: https://vercel.com/docs/speed-insights
