import { useLayoutEffect, useRef } from 'react'

export function useAiChatScroll(turns: readonly { id: string; pending?: boolean }[]) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const following = useRef(true)
  const previous = useRef({ top: 0, maximum: 0 })
  const lastTurn = useRef<string | undefined>(undefined)

  const onScroll = () => {
    const chat = scrollRef.current
    if (!chat) return
    const maximum = Math.max(0, chat.scrollHeight - chat.clientHeight)
    if (chat.scrollTop < previous.current.top - 1 && maximum >= previous.current.maximum)
      following.current = false
    else if (maximum - chat.scrollTop <= 1) following.current = true
    previous.current = { top: chat.scrollTop, maximum }
  }

  useLayoutEffect(() => {
    const chat = scrollRef.current
    if (!chat) return
    const turn = turns.at(-1)
    if (turn?.id !== lastTurn.current) following.current = true
    lastTurn.current = turn?.id
    const align = () => {
      if (!following.current) return
      const maximum = Math.max(0, chat.scrollHeight - chat.clientHeight)
      const actions = !turn?.pending && chat.lastElementChild?.querySelector('[data-ai-approval]')
      const target = actions
        ? chat.scrollTop +
          actions.getBoundingClientRect().bottom -
          chat.getBoundingClientRect().top -
          chat.clientTop -
          chat.clientHeight
        : maximum
      chat.scrollTop = Math.max(0, Math.min(maximum, target))
      previous.current = { top: chat.scrollTop, maximum }
    }
    align()
    const observer = new ResizeObserver(align)
    observer.observe(chat)
    if (chat.lastElementChild) observer.observe(chat.lastElementChild)
    return () => observer.disconnect()
  }, [turns])

  return { scrollRef, onScroll }
}
