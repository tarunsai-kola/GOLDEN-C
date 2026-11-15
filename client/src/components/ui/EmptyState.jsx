export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-4 p-12 text-center">
      {Icon && (
        <div className="p-4 bg-neutral-100 rounded-full">
          <Icon className="h-8 w-8 text-neutral-400" />
        </div>
      )}
      <div>
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
