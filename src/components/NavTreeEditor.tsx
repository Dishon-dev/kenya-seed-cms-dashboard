// cms-dashboard/src/components/NavTreeEditor.tsx
import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Chip,
  Typography,
  Alert,
  Menu,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AddBox as AddChildIcon,
  FormatIndentIncrease as IndentIcon,
  FormatIndentDecrease as OutdentIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NavId, NavItem, Direction } from '../types/header';

interface NavTreeEditorProps {
  items: NavItem[];
  onUpdate: (items: NavItem[]) => void;
  isSaving: boolean;
  onAddChild: (parentId: NavId) => void;
  onUpdateItem: (id: NavId, updates: Partial<NavItem>) => void;
  onDeleteItem: (id: NavId) => void;
  onMoveItem: (id: NavId, direction: Direction) => void;
  onIndentItem: (id: NavId) => void;
  onOutdentItem: (id: NavId) => void;
}

interface FlatItem extends NavItem {
  level: number;
}

// URL validation helper (conservative)
const isSafeUrl = (url?: string): boolean => {
  if (!url) return true;
  if (/^\/[A-Za-z0-9\-/]*$/.test(url)) return true;
  if (/^https?:\/\/[^\s]+$/.test(url)) return true;
  if (/^(mailto:|tel:)[^\s]+$/.test(url)) return true;
  return false;
};

/* ----------------- Sortable Row ----------------- */
const SortableNavItem: React.FC<{
  item: FlatItem;
  isSaving: boolean;
  onAddChild: (parentId: NavId) => void;
  onUpdateItem: (id: NavId, updates: Partial<NavItem>) => void;
  onDeleteItem: (id: NavId) => void;
  onMoveItem: (id: NavId, direction: Direction) => void;
  onIndentItem: (id: NavId) => void;
  onOutdentItem: (id: NavId) => void;
}> = ({ item, isSaving, onAddChild, onUpdateItem, onDeleteItem, onMoveItem, onIndentItem, onOutdentItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  // Overflow menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // cap indentation so fields don't get pushed off screen
  const indentPx = Math.min(item.level * 20, 80);

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        py: 1,
        pl: `${indentPx}px`,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
      disableGutters
    >
      {/* Drag handle */}
      <Box
        {...(!isSaving ? attributes : {})}
        {...(!isSaving ? listeners : {})}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0.5,
          mr: 1,
          borderRadius: 1,
          cursor: isSaving ? 'not-allowed' : 'grab',
          color: 'text.secondary',
          flex: '0 0 auto',
        }}
        aria-label={isSaving ? 'Dragging disabled while saving' : 'Drag to reorder'}
        title={isSaving ? 'Dragging disabled while saving' : 'Drag to reorder'}
      >
        <DragIcon fontSize="small" color={isSaving ? 'disabled' : 'action'} />
      </Box>

      {/* Inputs area */}
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {item.level > 0 && <Chip label={`Level ${item.level + 1}`} size="small" sx={{ mr: 1 }} />}
            <TextField
              size="small"
              value={item.title}
              onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
              placeholder="Link title"
              disabled={isSaving}
              inputProps={{ 'aria-label': `Title for ${item.title || 'link'}` }}
              sx={{ minWidth: 160, flex: '1 1 160px' }}
            />
            <TextField
              size="small"
              value={item.href || ''}
              onChange={(e) => onUpdateItem(item.id, { href: e.target.value })}
              placeholder="/path or https://..."
              disabled={isSaving}
              inputProps={{ 'aria-label': `URL for ${item.title || 'link'}` }}
              error={!!item.href && !isSafeUrl(item.href)}
              helperText={item.href && !isSafeUrl(item.href) ? 'Invalid URL' : ''}
              sx={{ minWidth: 160, flex: '1 1 200px' }}
            />
          </Box>
        }
      />

      {/* Overflow menu (single place for all actions) */}
      <ListItemSecondaryAction sx={{ right: 8, top: 8 }}>
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          aria-label={`Actions for ${item.title}`}
          disabled={isSaving}
        >
          <MoreVertIcon />
        </IconButton>

        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              onAddChild(item.id);
              handleMenuClose();
            }}
          >
            <AddChildIcon fontSize="small" sx={{ mr: 1 }} /> Add child
          </MenuItem>

          <MenuItem
            onClick={() => {
              onMoveItem(item.id, 'up');
              handleMenuClose();
            }}
          >
            <ArrowUpwardIcon fontSize="small" sx={{ mr: 1 }} /> Move up
          </MenuItem>

          <MenuItem
            onClick={() => {
              onMoveItem(item.id, 'down');
              handleMenuClose();
            }}
          >
            <ArrowDownwardIcon fontSize="small" sx={{ mr: 1 }} /> Move down
          </MenuItem>

          <MenuItem
            onClick={() => {
              onIndentItem(item.id);
              handleMenuClose();
            }}
          >
            <IndentIcon fontSize="small" sx={{ mr: 1 }} /> Indent
          </MenuItem>

          <MenuItem
            onClick={() => {
              onOutdentItem(item.id);
              handleMenuClose();
            }}
          >
            <OutdentIcon fontSize="small" sx={{ mr: 1 }} /> Outdent
          </MenuItem>

          <MenuItem
            onClick={() => {
              onDeleteItem(item.id);
              handleMenuClose();
            }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

/* ----------------- NavTreeEditor ----------------- */
const NavTreeEditor: React.FC<NavTreeEditorProps> = ({
  items,
  onUpdate,
  isSaving,
  onAddChild,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  onIndentItem,
  onOutdentItem,
}) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [showDragDisabled, setShowDragDisabled] = useState(false);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragDisabledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Flatten items for drag & drop
  const flattenItems = useCallback((input: NavItem[], level = 0): FlatItem[] => {
    const out: FlatItem[] = [];
    input.forEach(i => {
      out.push({
        id: i.id,
        title: i.title,
        href: i.href,
        order: i.order,
        parentId: i.parentId ?? null,
        children: [], // flattened representation doesn't carry nested children here
        level,
      } as FlatItem);
      if (i.children && i.children.length) {
        out.push(...flattenItems(i.children, level + 1));
      }
    });
    return out;
  }, []);

  // Rebuild tree structure from flattened items
  const rebuildTree = useCallback((flat: FlatItem[]): NavItem[] => {
    const root: NavItem[] = [];
    const stack: { node: NavItem; level: number }[] = [];

    flat.forEach(f => {
      const node: NavItem = {
        id: f.id,
        title: f.title,
        href: f.href,
        order: f.order ?? 0,
        parentId: f.parentId ?? null,
        children: [],
      };

      if (f.level === 0) {
        root.push(node);
        stack.length = 0;
        stack.push({ node, level: 0 });
        return;
      }

      while (stack.length && stack[stack.length - 1].level >= f.level) stack.pop();

      if (!stack.length) {
        // malformed levels, fallback to top-level
        root.push(node);
        stack.push({ node, level: f.level });
      } else {
        const parent = stack[stack.length - 1].node;
        parent.children = parent.children || [];
        parent.children.push(node);
        stack.push({ node, level: f.level });
      }
    });

    // cleanup empty children arrays to match expected shape
    const cleanup = (arr: NavItem[]): NavItem[] =>
      arr.map(n => {
        if (!n.children || n.children.length === 0) {
          const { children, ...rest } = n;
          return rest as NavItem;
        }
        return { ...n, children: cleanup(n.children!) };
      });

    return cleanup(root);
  }, []);

  const flattenedItems = useMemo(() => flattenItems(items), [items, flattenItems]);
  const itemIds = useMemo(() => flattenedItems.map(item => item.id), [flattenedItems]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (isSaving) {
      setShowDragDisabled(true);
      if (dragDisabledTimeoutRef.current) clearTimeout(dragDisabledTimeoutRef.current);
      dragDisabledTimeoutRef.current = setTimeout(() => setShowDragDisabled(false), 1800);
      return;
    }
    setActiveId(event.active.id);
    setDragError(null);
  }, [isSaving]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    if (isSaving) {
      setActiveId(null);
      return;
    }

    try {
      const oldIndex = itemIds.indexOf(active.id as NavId);
      const newIndex = itemIds.indexOf(over.id as NavId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFlattened = arrayMove(flattenedItems, oldIndex, newIndex);
        const newTree = rebuildTree(newFlattened);
        onUpdate(newTree);
      }
    } catch (err) {
      console.error('Drag operation failed:', err);
      setDragError('Failed to reorder items. Please try again.');
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setDragError(null), 3000);
    }

    setActiveId(null);
  }, [flattenedItems, itemIds, rebuildTree, onUpdate, isSaving]);

  const activeItem = activeId ? flattenedItems.find(it => it.id === activeId) : null;

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (dragDisabledTimeoutRef.current) clearTimeout(dragDisabledTimeoutRef.current);
    };
  }, []);

  return (
    <Box>
      {dragError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {dragError}
        </Alert>
      )}

      {showDragDisabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Reordering disabled while saving — please wait...
        </Alert>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <Paper variant="outlined">
            <List disablePadding>
              {flattenedItems.map((item) => (
                <SortableNavItem
                  key={String(item.id)}
                  item={item}
                  isSaving={isSaving}
                  onAddChild={onAddChild}
                  onUpdateItem={onUpdateItem}
                  onDeleteItem={onDeleteItem}
                  onMoveItem={onMoveItem}
                  onIndentItem={onIndentItem}
                  onOutdentItem={onOutdentItem}
                />
              ))}
            </List>
          </Paper>
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <Paper sx={{ p: 1, boxShadow: 6 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{activeItem.title || 'Untitled'}</Typography>
              <Typography variant="caption" color="text.secondary">{activeItem.href || 'No URL'}</Typography>
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>

      {items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No navigation items yet. Use the "Add Link" button to get started.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default NavTreeEditor;
