import { useSuspendStore } from '../../store/suspendStore'
import { fa } from '../../i18n'

interface Props { onSelect: (slotIndex: number) => void }

export default function SuspendedSlots({ onSelect }: Props) {
  const slots = useSuspendStore((s) => s.slots)
  return (
    <div className="space-y-2">
      {slots.map((slot, index) => {
        const total = slot.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
        const hasItems = slot.items.length > 0
        return (
          <button key={index} onClick={() => onSelect(index)} disabled={!hasItems}
            className={`w-full rounded p-3 text-left transition-colors ${hasItems ? 'bg-gray-700 hover:bg-blue-600' : 'bg-gray-800 border border-gray-700 border-dashed cursor-not-allowed'}`}>
            <div className="flex justify-between items-center">
              <div><span className="text-sm font-bold">{fa.pos.slot} {index + 1}</span><span className="text-xs text-gray-400 mr-2">(F{index + 5})</span></div>
              {hasItems ? <span className="text-sm font-bold">{total.toLocaleString('fa-IR')} {fa.common.toman}</span> : <span className="text-xs text-gray-600">{fa.pos.emptySlot}</span>}
            </div>
            {hasItems && <div className="text-xs text-gray-400 mt-1">{slot.items.length} {fa.pos.items}</div>}
          </button>
        )
      })}
    </div>
  )
}
