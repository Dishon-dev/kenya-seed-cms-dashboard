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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { ContactItem } from '../types/footer';

interface ContactListEditorProps {
  value: ContactItem[];
  onChange: (contacts: ContactItem[]) => void;
  disabled?: boolean;
}

const ContactListEditor: React.FC<ContactListEditorProps> = ({ value, onChange, disabled }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newContact, setNewContact] = useState<Partial<ContactItem>>({
    type: 'custom',
    label: '',
    value: '',
    icon: '',
    href: '',
  });

  const contactTypes = [
    { value: 'address', label: 'Address' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'hours', label: 'Working Hours' },
    { value: 'custom', label: 'Custom' },
  ];

  const iconOptions = [
    { value: 'MapPin', label: 'Map Pin' },
    { value: 'Phone', label: 'Phone' },
    { value: 'Mail', label: 'Mail' },
    { value: 'Clock', label: 'Clock' },
    { value: 'Globe', label: 'Globe' },
    { value: 'Building', label: 'Building' },
  ];

  const handleAddContact = () => {
    if (newContact.value?.trim()) {
      const contact: ContactItem = {
        id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: newContact.type || 'custom',
        label: newContact.label?.trim() || undefined,
        value: newContact.value.trim(),
        icon: newContact.icon || undefined,
        href: newContact.href?.trim() || undefined,
        order: value.length,
      };
      onChange([...value, contact]);
      setNewContact({
        type: 'custom',
        label: '',
        value: '',
        icon: '',
        href: '',
      });
    }
  };

  const handleUpdateContact = (index: number, field: keyof ContactItem, newValue: string) => {
    const updated = [...value];
    updated[index] = { 
      ...updated[index], 
      [field]: field === 'href' || field === 'label' ? (newValue.trim() || undefined) : newValue 
    };
    onChange(updated);
  };

  const handleDeleteContact = (index: number) => {
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

  const getTypeLabel = (type: string) => {
    return contactTypes.find(t => t.value === type)?.label || type;
  };

  const getIconLabel = (icon?: string) => {
    return iconOptions.find(i => i.value === icon)?.label || icon || 'No icon';
  };

  return (
    <Box>
      {/* Add new contact */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={newContact.type || 'custom'}
              onChange={(e) => setNewContact(prev => ({ ...prev, type: e.target.value as any }))}
              disabled={disabled}
            >
              {contactTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            size="small"
            placeholder="Label (optional)"
            value={newContact.label || ''}
            onChange={(e) => setNewContact(prev => ({ ...prev, label: e.target.value }))}
            disabled={disabled}
            sx={{ flex: 1 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Value"
            value={newContact.value || ''}
            onChange={(e) => setNewContact(prev => ({ ...prev, value: e.target.value }))}
            disabled={disabled}
            sx={{ flex: 1 }}
            required
          />
          
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Icon</InputLabel>
            <Select
              value={newContact.icon || ''}
              onChange={(e) => setNewContact(prev => ({ ...prev, icon: e.target.value }))}
              disabled={disabled}
            >
              <MenuItem value="">No icon</MenuItem>
              {iconOptions.map(icon => (
                <MenuItem key={icon.value} value={icon.value}>
                  {icon.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <TextField
          size="small"
          placeholder="Link URL (optional)"
          value={newContact.href || ''}
          onChange={(e) => setNewContact(prev => ({ ...prev, href: e.target.value }))}
          disabled={disabled}
          fullWidth
        />
        
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddContact}
          disabled={disabled || !newContact.value?.trim()}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add Contact
        </Button>
      </Box>

      {/* Contacts list */}
      <List dense>
        {value.map((contact, index) => (
          <ListItem key={contact.id} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, mb: 1 }}>
            <DragIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <ListItemText
              primary={
                <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip 
                    label={getTypeLabel(contact.type)} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  {contact.icon && (
                    <Chip 
                      label={getIconLabel(contact.icon)} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  )}
                </Box>
              }
              secondary={
                <Box component="div">
                  {editingIndex === index ? (
                    <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                      <TextField
                        size="small"
                        label="Label"
                        value={contact.label || ''}
                        onChange={(e) => handleUpdateContact(index, 'label', e.target.value)}
                        onBlur={() => setEditingIndex(null)}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Value"
                        value={contact.value}
                        onChange={(e) => handleUpdateContact(index, 'value', e.target.value)}
                        onBlur={() => setEditingIndex(null)}
                        fullWidth
                        required
                      />
                      <TextField
                        size="small"
                        label="Link URL"
                        value={contact.href || ''}
                        onChange={(e) => handleUpdateContact(index, 'href', e.target.value)}
                        onBlur={() => setEditingIndex(null)}
                        fullWidth
                      />
                    </Box>
                  ) : (
                    <Box component="div">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {contact.label && `${contact.label}: `}
                        {contact.href ? (
                          <a href={contact.href} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {contact.value}
                          </a>
                        ) : (
                          contact.value
                        )}
                      </Typography>
                      {contact.href && (
                        <Typography variant="caption" color="text.secondary">
                          Link: {contact.href}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
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
                onClick={() => handleDeleteContact(index)}
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

export default ContactListEditor;
