import { useState, type ReactNode } from 'react'
import {
  useFloating,
  useHover,
  useInteractions,
  offset,
  flip,
  shift,
  FloatingPortal,
} from '@floating-ui/react'

interface Props {
  content: ReactNode
  children: ReactNode
}

export default function Tooltip({ content, children }: Props) {
  const [open, setOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    middleware: [offset(6), flip(), shift({ padding: 8 })],
  })

  const hover = useHover(context, { delay: { open: 100, close: 0 } })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover])

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="tooltip"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
