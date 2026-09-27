import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { FooterLink, FooterSectionKey } from '../types/footer';

interface FooterListEditorProps {
  id: FooterSectionKey;
  value: FooterLink[];
  onChange: (links: FooterLink[]) => void;
  disabled?: boolean;
}

const FooterListEditor: React.FC<FooterListEditorProps> = ({ id, value, onChange, disabled }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLink, setNewLink] = useState({ title: '', href: '' });

  const handleAddLink = () => {
    if (newLink.title.trim()) {
      const link: FooterLink = {
        id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: newLink.title.trim(),
        href: newLink.href.trim() || undefined,
        order: value.length,
      };
      onChange([...value, link]);
      setNewLink({ title: '', href: '' });
    }
  };

  const handleUpdateLink = (index: number, field: keyof FooterLink, newValue: string) => {
    const updated = [...value];
    updated[index] = { 
      ...updated[index], 
      [field]: field === 'href' ? (newValue.trim() || undefined) : newValue 
    };
    onChange(updated);
  };

  const handleDeleteLink = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const updated = [...value];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      onChange(updated);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < value.length - 1) {
      const updated = [...value];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      onChange(updated);
    }
  };

  return (
    <Box>
      {/* Add new link */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Link title"
          value={newLink.title}
          onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
          disabled={disabled}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          placeholder="Link URL"
          value={newLink.href}
          onChange={(e) => setNewLink(prev => ({ ...prev, href: e.target.value }))}
          disabled={disabled}
          sx={{ flex: 1 }}
        />
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLink}
          disabled={disabled || !newLink.title.trim()}
        >
          Add
        </Button>
      </Box>

      {/* Links list */}
      <List dense>
        {value.map((link, index) => (
          <ListItem key={link.id} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, mb: 1 }}>
            <DragIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <ListItemText
              primary={
                editingIndex === index ? (
                  <TextField
                    size="small"
                    value={link.title}
                    onChange={(e) => handleUpdateLink(index, 'title', e.target.value)}
                    onBlur={() => setEditingIndex(null)}
                    autoFocus
                    fullWidth
                  />
                ) : (
                  <span onClick={() => setEditingIndex(index)} style={{ cursor: 'pointer' }}>
                    {link.title}
                  </span>
                )
              }
              secondary={
                editingIndex === index ? (
                  <TextField
                    size="small"
                    value={link.href || ''}
                    onChange={(e) => handleUpdateLink(index, 'href', e.target.value)}
                    onBlur={() => setEditingIndex(null)}
                    fullWidth
                    sx={{ mt: 1 }}
                  />
                ) : (
                  <span onClick={() => setEditingIndex(index)} style={{ cursor: 'pointer', color: '#666' }}>
                    {link.href || 'No URL'}
                  </span>
                )
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                size="small"
                onClick={() => handleMoveUp(index)}
                disabled={disabled || index === 0}
                title="Move up"
              >
                ↑
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleMoveDown(index)}
                disabled={disabled || index === value.length - 1}
                title="Move down"
              >
                ↓
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                disabled={disabled}
                title="Edit"
              ></IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteLink(index)}
                disabled={disabled}
                color="error"
                title="Delete"
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default FooterListEditor;
