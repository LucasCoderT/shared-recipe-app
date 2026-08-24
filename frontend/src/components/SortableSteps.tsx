import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { components } from "~/schema";

type Step = components["schemas"]["RecipeStep"];

const SortableStep = ({
    step,
    index,
    onRemove,
}: {
    step: Step;
    index: number;
    onRemove: (id: number, description: string) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: step.id });

    return (
        <Paper
            ref={setNodeRef}
            variant="outlined"
            sx={{
                p: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
                transform: CSS.Transform.toString(transform),
                transition,
                // Lift the dragged row above its neighbours.
                zIndex: isDragging ? 1 : 0,
                position: "relative",
                opacity: isDragging ? 0.85 : 1,
                boxShadow: isDragging ? 4 : 0,
            }}
        >
            {/* Only the handle starts a drag, so the row stays selectable. The
                spread carries dnd-kit's keyboard bindings: space to pick up,
                arrows to move, space to drop. */}
            <IconButton
                size="small"
                {...attributes}
                {...listeners}
                aria-label={`Reorder step ${index + 1}`}
                sx={{ cursor: "grab", touchAction: "none" }}
            >
                <DragIndicatorIcon fontSize="small" />
            </IconButton>

            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
                {index + 1}.
            </Typography>
            <Typography sx={{ flexGrow: 1 }}>{step.description}</Typography>

            <IconButton
                onClick={() => onRemove(step.id, step.description)}
                aria-label="Delete step"
            >
                <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
        </Paper>
    );
};

export const SortableSteps = ({
    steps,
    onReorder,
    onRemove,
}: {
    steps: Step[];
    onReorder: (order: number[]) => void;
    onRemove: (id: number, description: string) => void;
}) => {
    const sensors = useSensors(
        // A small distance threshold keeps a click on the delete button from
        // being swallowed as the start of a drag.
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        const ids = steps.map((step) => step.id);
        const from = ids.indexOf(Number(active.id));
        const to = ids.indexOf(Number(over.id));
        // The server wants the complete order, not a from/to pair.
        onReorder(arrayMove(ids, from, to));
    };

    if (steps.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                No steps yet.
            </Typography>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={steps.map((step) => step.id)}
                strategy={verticalListSortingStrategy}
            >
                <Stack spacing={1}>
                    {steps.map((step, index) => (
                        <SortableStep
                            key={step.id}
                            step={step}
                            index={index}
                            onRemove={onRemove}
                        />
                    ))}
                </Stack>
            </SortableContext>
            <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    Drag the handle to reorder, or focus it and use space then the arrow keys.
                </Typography>
            </Box>
        </DndContext>
    );
};
