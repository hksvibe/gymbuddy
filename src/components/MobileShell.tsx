import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  bottomBar?: ReactNode
}

// Phone-frame layout: centers everything in a 420px column on desktop,
// fills the screen on mobile. Keeps the bottom-nav stuck to the bottom.
export default function MobileShell({ children, bottomBar }: Props) {
  return (
    <div className="min-h-dvh w-full bg-white flex justify-center">
      <div className="w-full max-w-[440px] min-h-dvh flex flex-col bg-white relative">
        <div className="flex-1 flex flex-col">{children}</div>
        {bottomBar && (
          <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur border-t border-gray-100">
            {bottomBar}
          </div>
        )}
      </div>
    </div>
  )
}
