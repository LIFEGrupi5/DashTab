import DynamicKitchenBoard from '@/components/DynamicKitchenBoard'

export default function KitchenPage() {
  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Kitchen Board</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Live order queue</p>
      </div>
      <DynamicKitchenBoard />
    </div>
  )
}
