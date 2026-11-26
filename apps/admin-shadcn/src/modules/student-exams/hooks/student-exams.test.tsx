import {
  deviceId,
  lib_attempts_loadStudent as loadStudent,
  lib_attempts_saveStudent as saveStudent,
  store_app_useApp as useApp,
  store_online_useOnline as useOnline,
} from '@student-engine'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { t } from '@/i18n/translate-student'
import { ReportExamButtonContainer } from '@/modules/student-exams/containers/exam-view-container'
import { studentDoc, studentExam, studentRemoteId } from '@/modules/student-exams/testing/fixture'
import { server } from '@/testing/msw/server'

import {
  useExamViewContainer,
  useReportExamButtonContainer,
  useSaveMenuContainer,
} from './use-exam-view-container'
import {
  studentKey,
  useOnlineOpenContainer,
  useStudentFormContainer,
} from './use-online-open-container'
import { useQuizContainer, useTrueFalseInputContainer } from './use-quiz-container'

import type { ReactNode } from 'react'

const auth = vi.hoisted(() => ({
  session: null as unknown,
  delaySession: undefined as Promise<void> | undefined,
}))
const route = vi.hoisted(() => ({ id: '', push: vi.fn(), replace: vi.fn() }))
const dialogs = vi.hoisted(() => ({
  alert: vi.fn(async () => {}),
  prompt: vi.fn(async () => 'An'),
  confirm: vi.fn(async () => true),
}))
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserSupabase: () => ({
    auth: {
      getSession: async () => {
        await auth.delaySession
        return { data: { session: auth.session }, error: null }
      },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  }),
}))
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: route.id }),
  usePathname: () => '/play/example',
  useRouter: () => ({ push: route.push, replace: route.replace }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@engine-dialogs', () => ({ dialog: dialogs }))

let client: QueryClient
const api = 'http://localhost:3000/api'
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
function play(options: { listed?: boolean; attempted?: boolean; oneAttempt?: boolean } = {}) {
  server.use(
    http.get(`${api}/exams/${studentRemoteId}/play`, () =>
      HttpResponse.json({
        doc: {
          ...studentDoc,
          online: {
            ...studentExam,
            settings: { ...studentExam.settings, oneAttempt: options.oneAttempt },
          },
        },
      }),
    ),
    http.get(`${api}/exams/${studentRemoteId}/gate`, () =>
      HttpResponse.json({ listed: options.listed ?? false, attempted: options.attempted ?? false }),
    ),
  )
}
function remoteQuiz() {
  route.id = useApp.getState().importExam({ ...studentExam, id: studentRemoteId })
  saveStudent({ name: 'An', className: '10A1', seat: 7 })
  sessionStorage.setItem(studentKey(studentRemoteId), '1')
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  route.id = studentRemoteId
  auth.session = null
  auth.delaySession = undefined
  useApp.setState({
    myExams: [],
    activeQuizId: null,
    quizAnswers: {},
    quizStartedAt: null,
    quizRemaining: null,
    quizSubmitted: false,
    lastResult: null,
  })
  useOnline.setState({ items: [] })
})

describe('student play and identity', () => {
  it('loads an unlisted exam anonymously and gates with the persisted device ID', async () => {
    play()
    const devices: string[] = []
    server.use(
      http.get(`${api}/exams/${studentRemoteId}/gate`, ({ request }) => {
        devices.push(new URL(request.url).searchParams.get('deviceId')!)
        return HttpResponse.json({ listed: false, attempted: false })
      }),
    )
    const { result } = renderHook(useOnlineOpenContainer, { wrapper })
    await waitFor(() => expect(result.current.viewState).toBe(2))
    expect(devices).toEqual([deviceId()])
    if (result.current.viewState !== 2) throw new Error('student form missing')
    act(
      () =>
        result.current.viewState === 2 &&
        result.current.onStudentStart({ name: 'An', className: '10A1', seat: 7 }),
    )
    expect(loadStudent()).toEqual({ name: 'An', className: '10A1', seat: 7 })
    expect(sessionStorage.getItem(studentKey(studentRemoteId))).toBe('1')
    expect(route.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/quiz\//))
  })
  it.each([
    { listed: true, oneAttempt: false },
    { listed: true, oneAttempt: true },
  ])('starts listed exams for eligible sessions: %j', async (options) => {
    play(options)
    if (options.oneAttempt)
      auth.session = {
        access_token: 'test-token',
        user: { id: 'test-user', email: 'an@example.com', user_metadata: {} },
      }
    renderHook(useOnlineOpenContainer, { wrapper })
    await waitFor(() => expect(route.replace).toHaveBeenCalled())
  })
  it('requires login for one-attempt exams without starting or importing them', async () => {
    play({ oneAttempt: true })
    const { result } = renderHook(useOnlineOpenContainer, { wrapper })
    await waitFor(() => expect(result.current.viewState).toBe(1))
    expect(route.replace).not.toHaveBeenCalled()
    expect(useApp.getState().myExams).toHaveLength(0)
  })
  it('shows the completed state before the login requirement for a used device', async () => {
    play({ oneAttempt: true, attempted: true })
    const { result } = renderHook(useOnlineOpenContainer, { wrapper })
    await waitFor(() => expect(result.current.viewState).toBe(0))
    expect(result.current).toMatchObject({ done: true })
    expect(route.replace).not.toHaveBeenCalled()
  })
  it('surfaces Problem Details without importing an inaccessible exam', async () => {
    play()
    server.use(
      http.get(`${api}/exams/${studentRemoteId}/play`, () =>
        HttpResponse.json(
          { title: 'Not found', status: 404, detail: 'Đề đã được gỡ.' },
          { status: 404 },
        ),
      ),
    )
    const { result } = renderHook(useOnlineOpenContainer, { wrapper })
    await waitFor(() =>
      expect(result.current).toMatchObject({ viewState: 0, error: 'Đề đã được gỡ.' }),
    )
    expect(useApp.getState().myExams).toHaveLength(0)
  })
  it('validates empty fields, then submits a roster identity with its derived seat', async () => {
    const start = vi.fn()
    const { result } = renderHook(
      () =>
        useStudentFormContainer({
          exam: { ...studentExam, settings: { roster: ['An', 'Bình'] } },
          onStart: start,
        }),
      { wrapper },
    )
    await act(async () => {
      await result.current.submit()
    })
    expect(start).not.toHaveBeenCalled()
    expect(result.current.err).toBeTruthy()
    act(() => {
      result.current.setName('Bình')
      result.current.setClassName(' 10A1 ')
    })
    await act(async () => {
      await result.current.submit()
    })
    expect(start).toHaveBeenCalledWith({ name: 'Bình', className: '10A1', seat: 2 })
  })
})

describe('quiz local and remote attempts', () => {
  it('auto-submits a timed local quiz when its countdown expires', () => {
    vi.useFakeTimers()
    try {
      route.id = studentExam.id
      useApp.setState({
        myExams: [
          {
            ...structuredClone(studentExam),
            durationMinutes: 1 / 60,
            settings: { noTimeLimit: false },
          },
        ],
      })
      const { result } = renderHook(useQuizContainer, { wrapper })
      act(() => vi.advanceTimersByTime(1000))
      expect(result.current).toMatchObject({ viewState: 2, lastResult: { score: 0, total: 2 } })
    } finally {
      vi.useRealTimers()
    }
  })
  it('records partial true/false answers and reveals the key only during review', () => {
    const answer = vi.fn()
    const question = {
      ...studentExam.sections[0]!.questions[0]!,
      type: 'dung-sai' as const,
      answer: 'ĐS',
    }
    const { result, rerender } = renderHook(
      ({ chosen, review }) =>
        useTrueFalseInputContainer({
          question: { ...question, options: question.options!.slice(0, 2) },
          chosen,
          onAnswer: answer,
          review,
        }),
      { initialProps: { chosen: '', review: false } },
    )
    expect(result.current.correct).toBeNull()
    act(() => result.current.set(0, true))
    expect(answer).toHaveBeenCalledWith(expect.stringMatching(/^Đ/))
    rerender({ chosen: 'ĐS', review: true })
    expect(result.current.values).toEqual([true, false])
    expect(result.current.correct).toEqual([true, false])
  })
  it.each([false, true])(
    'handles missing and empty local exams without submission: empty=%s',
    (empty) => {
      route.id = studentExam.id
      if (empty) useApp.setState({ myExams: [{ ...studentExam, sections: [] }] })
      const { result } = renderHook(useQuizContainer, { wrapper })
      expect(result.current.viewState).toBe(empty ? 1 : 0)
      expect(client.getMutationCache().getAll()).toHaveLength(0)
    },
  )
  it('tracks navigation, flags, answers, confirmation, local scoring, review and restart', () => {
    route.id = studentExam.id
    useApp.setState({ myExams: [structuredClone(studentExam)] })
    const { result } = renderHook(useQuizContainer, { wrapper })
    act(() => {
      if (result.current.viewState === 3) {
        result.current.setAnswer('question-one', 'A')
        result.current.setIndex(1)
        result.current.setFlagged(new Set(['question-two']))
        result.current.setConfirm(true)
      }
    })
    expect(result.current).toMatchObject({ viewState: 3, index: 1, answered: 1, confirm: true })
    act(() => {
      if (result.current.viewState === 3) {
        result.current.setAnswer('question-two', '5')
        result.current.handleSubmit()
      }
    })
    expect(result.current).toMatchObject({ viewState: 2, lastResult: { score: 2, total: 2 } })
    act(() => {
      if (result.current.viewState === 2) result.current.setReviewing(true)
    })
    expect(result.current).toMatchObject({ reviewing: true })
    act(() => {
      if (result.current.viewState === 2) result.current.restart?.()
    })
    expect(result.current).toMatchObject({ viewState: 3, index: 0, answered: 0, confirm: false })
  })
  it('sends original question IDs and student/device fields, never a client score, and applies server grading', async () => {
    remoteQuiz()
    let body: Record<string, unknown> | undefined
    server.use(
      http.post(`${api}/exams/${studentRemoteId}/attempts`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          score: 1.5,
          max: 2,
          gradable: 2,
          correct: 1,
          key: { 'question-one': { answer: 'A', explanation: 'Lời giải từ máy chủ' } },
        })
      }),
    )
    const { result } = renderHook(useQuizContainer, { wrapper })
    const question = useApp.getState().myExams[0]!.sections[0]!.questions[0]!
    act(() => {
      if (result.current.viewState === 3) {
        result.current.setAnswer(question.id, 'A')
        result.current.handleSubmit()
      }
    })
    await waitFor(() =>
      expect(result.current).toMatchObject({
        viewState: 2,
        sent: 'sent',
        lastResult: { score: 1.5, total: 2 },
      }),
    )
    expect(body).toMatchObject({
      name: 'An',
      className: '10A1',
      seat: 7,
      deviceId: deviceId(),
      answers: { 'question-one': 'A' },
    })
    expect(body).not.toHaveProperty('score')
    expect(useApp.getState().myExams[0]!.sections[0]!.questions[0]!.explanation).toBe(
      'Lời giải từ máy chủ',
    )
    expect(client.getMutationCache().getAll()).toHaveLength(1)
  })
  it('supports a withheld score without displaying local grading', async () => {
    remoteQuiz()
    server.use(
      http.post(`${api}/exams/${studentRemoteId}/attempts`, () =>
        HttpResponse.json({ submitted: true, hidden: true }),
      ),
    )
    const { result } = renderHook(useQuizContainer, { wrapper })
    act(() => {
      if (result.current.viewState === 3) result.current.handleSubmit()
    })
    await waitFor(() =>
      expect(result.current).toMatchObject({
        viewState: 2,
        sent: 'sent',
        scoreHidden: true,
        pending: false,
      }),
    )
  })
  it('preserves failed attempt state and the server Problem Details message', async () => {
    remoteQuiz()
    server.use(
      http.post(`${api}/exams/${studentRemoteId}/attempts`, () =>
        HttpResponse.json({ status: 409, detail: 'Bạn đã nộp bài này.' }, { status: 409 }),
      ),
    )
    const { result } = renderHook(useQuizContainer, { wrapper })
    act(() => {
      if (result.current.viewState === 3) result.current.handleSubmit()
    })
    await waitFor(() => expect(result.current).toMatchObject({ viewState: 2, sent: 'failed' }))
    expect(client.getMutationCache().getAll()[0]!.state.error?.message).toBe('Bạn đã nộp bài này.')
  })
})

describe('community view, saving and reports', () => {
  it('waits for auth initialization so a bootstrap cache clear cannot strand the exam query', async () => {
    let resume!: () => void
    auth.delaySession = new Promise<void>((resolve) => {
      resume = resolve
    })
    auth.session = {
      access_token: 'test-token',
      user: { id: 'test-user', email: 'an@example.com', user_metadata: {} },
    }
    let reads = 0
    server.use(
      http.get(`${api}/exams/community/${studentRemoteId}`, () => {
        reads++
        return HttpResponse.json(studentDoc)
      }),
    )
    const { result } = renderHook(useExamViewContainer, { wrapper })
    expect(result.current.viewState).toBe(2)
    expect(reads).toBe(0)
    act(() => client.clear())
    await act(async () => {
      resume()
      await auth.delaySession
    })
    await waitFor(() =>
      expect(result.current).toMatchObject({ viewState: 1, exam: { title: studentExam.title } }),
    )
    expect(reads).toBe(1)
  })
  it.each(['play', 'community'])(
    'handles malformed %s documents as an error rather than crashing',
    async (endpoint) => {
      play()
      const path =
        endpoint === 'play'
          ? `${api}/exams/${studentRemoteId}/play`
          : `${api}/exams/community/${studentRemoteId}`
      server.use(http.get(path, () => HttpResponse.json(endpoint === 'play' ? { doc: {} } : {})))
      const { result } = renderHook<
        ReturnType<typeof useOnlineOpenContainer> | ReturnType<typeof useExamViewContainer>,
        void
      >(endpoint === 'play' ? useOnlineOpenContainer : useExamViewContainer, { wrapper })
      await waitFor(() =>
        expect(result.current).toMatchObject({
          viewState: 0,
          error: t('studentCopy.invalidDocument'),
        }),
      )
    },
  )
  it('loads a community document through the typed query', async () => {
    server.use(
      http.get(`${api}/exams/community/${studentRemoteId}`, () => HttpResponse.json(studentDoc)),
    )
    const { result } = renderHook(useExamViewContainer, { wrapper })
    await waitFor(() =>
      expect(result.current).toMatchObject({ viewState: 1, exam: { title: studentExam.title } }),
    )
  })
  it('shows missing local exams and remote Problem Details', async () => {
    route.id = 'missing-local'
    const missing = renderHook(useExamViewContainer, { wrapper })
    expect(missing.result.current.viewState).toBe(0)
    missing.unmount()
    route.id = studentRemoteId
    server.use(
      http.get(`${api}/exams/community/${studentRemoteId}`, () =>
        HttpResponse.json({ status: 404, detail: 'Đề không còn công khai.' }, { status: 404 }),
      ),
    )
    const { result } = renderHook(useExamViewContainer, { wrapper })
    await waitFor(() =>
      expect(result.current).toMatchObject({ viewState: 0, error: 'Đề không còn công khai.' }),
    )
  })
  it('saves an independent local online draft and navigates to its builder', () => {
    const { result } = renderHook(() => useSaveMenuContainer({ exam: studentExam }), { wrapper })
    act(() => result.current.toOnline())
    expect(useOnline.getState().items).toHaveLength(1)
    expect(useOnline.getState().items[0]!.meta.title).toBe(studentExam.title)
    expect(route.push).toHaveBeenCalledWith(expect.stringMatching(/^\/online-exams\//))
  })
  it('requires login before opening a report dialog', async () => {
    const { result } = renderHook(() => useReportExamButtonContainer({ examId: studentRemoteId }), {
      wrapper,
    })
    await act(async () => result.current.handleOpen())
    expect(result.current.open).toBe(false)
    expect(dialogs.alert).toHaveBeenCalled()
    expect(client.getMutationCache().getAll()).toHaveLength(0)
  })
  it('submits the report dialog exclusively through MSW and closes it after success', async () => {
    auth.session = {
      access_token: 'test-token',
      user: { id: 'test-user', email: 'an@example.com', user_metadata: {} },
    }
    let payload: unknown
    server.use(
      http.post(`${api}/exams/${studentRemoteId}/reports`, async ({ request }) => {
        payload = await request.json()
        return new HttpResponse(null, { status: 201 })
      }),
    )
    render(<ReportExamButtonContainer examId={studentRemoteId} />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: t('studentCopy.m392') }))
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' Nội dung kiểm thử MSW ' } })
    fireEvent.click(screen.getByRole('button', { name: t('studentCopy.m403') }))
    await waitFor(() =>
      expect(payload).toEqual({ reason: t('studentCopy.m371'), detail: 'Nội dung kiểm thử MSW' }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
  it('keeps the report form open after a server error', async () => {
    auth.session = {
      access_token: 'test-token',
      user: { id: 'test-user', email: 'an@example.com', user_metadata: {} },
    }
    server.use(
      http.post(`${api}/exams/${studentRemoteId}/reports`, () =>
        HttpResponse.json({ status: 403, detail: 'Không thể gửi báo cáo.' }, { status: 403 }),
      ),
    )
    const { result } = renderHook(() => useReportExamButtonContainer({ examId: studentRemoteId }), {
      wrapper,
    })
    await act(async () => result.current.handleOpen())
    await act(async () => {
      await result.current.handleSubmit()
    })
    expect(result.current.open).toBe(true)
    expect(dialogs.alert).toHaveBeenCalledWith('Không thể gửi báo cáo.', expect.anything())
  })
})
