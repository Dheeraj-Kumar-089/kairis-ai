import * as React from 'react'
import { ArrowDown } from 'lucide-react'
import {
  MessageScroller as MessageScrollerPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '@shadcn/react/message-scroller'

import { cn } from '@/lib/utils'

function MessageScrollerProvider(props) {
  return <MessageScrollerPrimitive.Provider {...props} />
}

function MessageScroller({ className, ...props }) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn(
        'group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden',
        className
      )}
      {...props}
    />
  )
}

function MessageScrollerViewport({ className, ...props }) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        'size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain',
        className
      )}
      {...props}
    />
  )
}

function MessageScrollerContent({ className, ...props }) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      className={cn('flex h-max min-h-full flex-col gap-3', className)}
      {...props}
    />
  )
}

function MessageScrollerItem({ className, scrollAnchor = false, ...props }) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      scrollAnchor={scrollAnchor}
      className={cn(
        'min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]',
        className
      )}
      {...props}
    />
  )
}

function MessageScrollerButton({
  direction = 'end',
  className,
  children,
  ...props
}) {
  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      data-direction={direction}
      direction={direction}
      className={cn(
        'absolute left-1/2 -translate-x-1/2 inline-flex size-9 items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] shadow-md transition-[translate,scale,opacity] duration-200 hover:bg-black/10 dark:hover:bg-white/10 data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full data-[direction=start]:[&_svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDown className="size-4" />
          <span className="sr-only">
            {direction === 'end' ? 'Scroll to end' : 'Scroll to start'}
          </span>
        </>
      )}
    </MessageScrollerPrimitive.Button>
  )
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
}
