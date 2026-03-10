import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, children, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab"
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded p-2 mb-2 position-relative">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", display: "inline-block", marginRight: 8 }}
        title="Drag to reorder"
      >
        ⠿
      </div>

      {/* Remove button */}
      <button
        type="button"
        className="btn-close position-absolute top-0 end-0 m-1"
        style={{ fontSize: "0.6rem" }}
        onClick={onRemove}
      />

      {children}
    </div>
  );
}
export default SortableItem;