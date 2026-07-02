import { NavLink } from 'react-router-dom'
import { Dumbbell, CalendarDays, Flame, Wrench } from 'lucide-react'

export default function BottomNav() {
  const item = (to: string, Icon: typeof Dumbbell, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
          isActive ? 'text-violet-deep' : 'text-gray-400'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  )
  return (
    <nav className="flex pb-[env(safe-area-inset-bottom)]">
      {item('/today', Dumbbell, 'Today')}
      {item('/week', CalendarDays, 'Week')}
      {item('/progress', Flame, 'Progress')}
      {item('/gym', Wrench, 'My Gym')}
    </nav>
  )
}
