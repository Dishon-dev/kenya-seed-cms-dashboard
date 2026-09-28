import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Pagination,
} from "@mui/material";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Tender {
  id: string;
  tenderNo: string;
  description: string;
  startDate: string;
  closingDate: string;
  fileUrl?: string | null;
  documents?: {
    id: string;
    filename: string;
    mimeType?: string;
    size?: number;
    fileUrl: string;
    order?: number;
    isActive?: boolean;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TendersData {
  id: string;
  hero: {
    title: string;
    subtitle: string;
  };
  tenders: Tender[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

const TenderEditor: React.FC = () => {
  const [tendersData, setTendersData] = useState<TendersData | null>(null);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenderToDelete, setTenderToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  // Files selected while creating a new tender, before it has an id yet.
  // Held here and uploaded automatically right after the tender is
  // created, so document upload works in one step instead of requiring
  // "save first, then edit again to upload".
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [previewPage, setPreviewPage] = useState(1);

  const PREVIEW_ITEMS_PER_PAGE = 3;

  const queryClient = useQueryClient();

  // Database-first approach - no local storage fallback needed

  // Fetch tenders from database
  const {
    data: tendersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tenders"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/tenders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return response.data;
    },
    retry: 2,
    staleTime: 30000,
  });

  useEffect(() => {
    if (tendersResponse) {
      setTendersData(tendersResponse);
    }
  }, [tendersResponse]);

  const activePreviewTenders =
    tendersData?.tenders.filter((tender) => tender.isActive) || [];

  const previewPageCount = Math.ceil(
    activePreviewTenders.length / PREVIEW_ITEMS_PER_PAGE
  );

  const paginatedPreviewTenders = activePreviewTenders.slice(
    (previewPage - 1) * PREVIEW_ITEMS_PER_PAGE,
    previewPage * PREVIEW_ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (previewPage > previewPageCount && previewPageCount > 0) {
      setPreviewPage(previewPageCount);
    }

    if (previewPageCount === 0 && previewPage !== 1) {
      setPreviewPage(1);
    }
  }, [previewPage, previewPageCount]);

  // Update tenders mutation
  const updateTendersMutation = useMutation({
    mutationFn: async (data: TendersData) => {
      const response = await axios.post(`${API_BASE}/api/tenders`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // The backend's response here is just { success, message } - it has
      // no tenders array, so it can't be used to replace tendersData (that
      // previously wiped out the whole tenders list). The local
      // tendersData.hero values are already correct - the form fields
      // write directly to state as the admin types - so there's nothing to
      // merge in from the response, just confirm the save succeeded.
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      setMessage({ type: "success", text: "Tenders updated successfully" });
    },
    onError: (error: any) => {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update tenders",
      });
    },
  });

  // Create tender mutation
  const createTenderMutation = useMutation({
    mutationFn: async (tenderData: Partial<Tender>) => {
      const response = await axios.post(
        `${API_BASE}/api/tenders/create`,
        tenderData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      // The backend wraps the created tender as { success, data, message } -
      // unwrap .data here, the same way updateTenderMutation already does,
      // rather than passing the whole wrapper through as if it were the tender.
      return response.data.data || response.data;
    },
    onSuccess: (newTender) => {
      if (tendersData) {
        const updatedTenders = [...tendersData.tenders, newTender];
        const updatedData = { ...tendersData, tenders: updatedTenders };
        queryClient.setQueryData(["tenders"], updatedData);
        setTendersData(updatedData);
      }
      // Dialog close/editingTender clear now happens in handleSaveTender,
      // after any pending documents have finished uploading - closing here
      // unconditionally would close the dialog before that upload runs.
    },
    onError: (error: any) => {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to create tender",
      });
    },
  });

  // Update tender mutation
  const updateTenderMutation = useMutation({
    mutationFn: async ({
      id,
      ...tenderData
    }: Partial<Tender> & { id: string }) => {
      // tenderData already excludes id due to destructuring, so we can use it directly
      console.log(`Sending update request for tender ${id}:`, tenderData);
      const response = await axios.put(
        `${API_BASE}/api/tenders/${id}`,
        tenderData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`Received response:`, response.data);
      // API returns { success: true, data: updatedTender, message: '...' }
      return response.data.data || response.data;
    },
    onSuccess: (updatedTender) => {
      console.log("Tender updated successfully:", updatedTender);
      if (tendersData) {
        const updatedTenders = tendersData.tenders.map((tender) =>
          tender.id === updatedTender.id ? updatedTender : tender
        );
        const updatedData = { ...tendersData, tenders: updatedTenders };
        queryClient.setQueryData(["tenders"], updatedData);
        setTendersData(updatedData);
      }
      // Only show dialog message if dialog is open (for edit operations)
      // For toggle operations, show snackbar instead
      if (isDialogOpen) {
        setMessage({ type: "success", text: "Tender updated successfully" });
        setIsDialogOpen(false);
        setEditingTender(null);
      } else {
        // For toggle operations, show snackbar
        setSnackbar({
          open: true,
          message: `Tender ${
            updatedTender.isActive ? "activated" : "deactivated"
          } successfully`,
          severity: "success",
        });
      }
    },
    onError: (error: any) => {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update tender",
      });
    },
  });

  // Delete tender mutation
  const deleteTenderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${API_BASE}/api/tenders/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    },
    onSuccess: (_data, deletedId) => {
      // The backend's delete response is just { success, message } - it
      // doesn't include the tenders list, so it can't be used to replace
      // tendersData directly (that previously wiped out the whole list and
      // would crash the page on the next render). Remove the deleted
      // tender from the existing local state instead.
      if (tendersData) {
        const updatedTenders = tendersData.tenders.filter(
          (tender) => tender.id !== deletedId
        );
        const updatedData = { ...tendersData, tenders: updatedTenders };
        queryClient.setQueryData(["tenders"], updatedData);
        setTendersData(updatedData);
      }
      setMessage({ type: "success", text: "Tender deleted successfully" });
      setIsDeleteDialogOpen(false);
      setTenderToDelete(null);
    },
    onError: (error: any) => {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to delete tender",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({
      tenderId,
      files,
    }: {
      tenderId: string;
      files: File[];
    }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await axios.post(
        `${API_BASE}/api/tenders/${tenderId}/documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: "Documents uploaded successfully",
        severity: "success",
      });
      return data;
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to upload documents",
        severity: "error",
      });
    },
  });

  // Remove a single wrongly-uploaded tender document
  const removeDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await axios.delete(
        `${API_BASE}/api/tenders/documents/${documentId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      return response.data;
    },
    onSuccess: (_data, documentId) => {
      if (editingTender) {
        const updatedDocuments = (editingTender.documents || []).filter(
          (doc) => doc.id !== documentId
        );
        setEditingTender({ ...editingTender, documents: updatedDocuments });
        if (tendersData) {
          const updatedTenders = tendersData.tenders.map((tender) =>
            tender.id === editingTender.id
              ? { ...tender, documents: updatedDocuments }
              : tender
          );
          const updatedData = { ...tendersData, tenders: updatedTenders };
          queryClient.setQueryData(["tenders"], updatedData);
          setTendersData(updatedData);
        }
      }
      setSnackbar({
        open: true,
        message: "Document removed",
        severity: "success",
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to remove document",
        severity: "error",
      });
    },
  });

  const handleAddTender = () => {
    setEditingTender({
      id: "",
      tenderNo: "",
      description: "",
      startDate: "",
      closingDate: "",
      fileUrl: null,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    });
    setPendingFiles([]);
    setIsDialogOpen(true);
  };

  const handleEditTender = (tender: Tender) => {
    setEditingTender(tender);
    setPendingFiles([]);
    setIsDialogOpen(true);
  };

  const handleDeleteTender = (id: string) => {
    setTenderToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleTender = (tender: Tender) => {
    console.log(
      `Toggling tender ${tender.id} from ${
        tender.isActive
      } to ${!tender.isActive}`
    );
    // Only send the isActive field to toggle
    updateTenderMutation.mutate(
      {
        id: tender.id,
        isActive: !tender.isActive,
      },
      {
        onError: (error: any) => {
          console.error("Error toggling tender:", error);
          console.error("Error response:", error.response?.data);
          const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Failed to update tender status";
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: "error",
          });
        },
      }
    );
  };

  const confirmDeleteTender = () => {
    if (tenderToDelete) {
      deleteTenderMutation.mutate(tenderToDelete);
    }
  };

  const handleSaveTender = async () => {
    if (!editingTender) return;

    const tenderData = {
      tenderNo: editingTender.tenderNo,
      description: editingTender.description,
      startDate: editingTender.startDate,
      closingDate: editingTender.closingDate,
      fileUrl: editingTender.fileUrl,
      isActive: editingTender.isActive,
    };

    if (editingTender.id) {
      updateTenderMutation.mutate({ id: editingTender.id, ...tenderData });
      return;
    }

    try {
      const newTender = await createTenderMutation.mutateAsync(tenderData);

      // If documents were selected before the tender existed, upload them
      // now that we have a real id to attach them to - this is what makes
      // "create with documents in one step" actually work, rather than
      // requiring save-then-edit-then-upload.
      if (pendingFiles.length > 0 && newTender?.id) {
        setUploadingFile(true);
        try {
          const uploadResult = await uploadFileMutation.mutateAsync({
            tenderId: newTender.id,
            files: pendingFiles,
          });
          const uploadedDocs = uploadResult?.documents || [];
          setTendersData((prev) => {
            if (!prev) return prev;
            const updatedTenders = prev.tenders.map((t) =>
              t.id === newTender.id ? { ...t, documents: uploadedDocs } : t
            );
            const updatedData = { ...prev, tenders: updatedTenders };
            queryClient.setQueryData(["tenders"], updatedData);
            return updatedData;
          });
        } catch (uploadError) {
          console.error(
            "Failed to upload documents for new tender:",
            uploadError
          );
          setSnackbar({
            open: true,
            message:
              "Tender created, but document upload failed. You can upload them from Edit.",
            severity: "error",
          });
        } finally {
          setUploadingFile(false);
        }
      }

      setMessage({ type: "success", text: "Tender created successfully" });
      setPendingFiles([]);
      setIsDialogOpen(false);
      setEditingTender(null);
    } catch {
      // createTenderMutation's own onError already surfaces this
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    if (!editingTender?.id) {
      // No tender saved yet - hold these locally rather than rejecting the
      // upload attempt. handleSaveTender uploads them automatically right
      // after the tender is created.
      setPendingFiles((prev) => [...prev, ...files]);
      event.target.value = "";
      return;
    }

    setUploadingFile(true);
    try {
      const result = await uploadFileMutation.mutateAsync({
        tenderId: editingTender.id,
        files,
      });
      const uploaded = result?.documents || [];
      if (editingTender) {
        const updatedDocuments = [
          ...(editingTender.documents || []),
          ...uploaded,
        ];
        setEditingTender({ ...editingTender, documents: updatedDocuments });
        if (tendersData) {
          const updatedTenders = tendersData.tenders.map((tender) =>
            tender.id === editingTender.id
              ? { ...tender, documents: updatedDocuments }
              : tender
          );
          const updatedData = { ...tendersData, tenders: updatedTenders };
          // This was missing before - only local component state was
          // updated, not the query cache, which is why newly uploaded
          // documents needed a full page refresh to actually appear:
          // anything that read from the cache (rather than this
          // component's own state) never learned about the upload.
          queryClient.setQueryData(["tenders"], updatedData);
          setTendersData(updatedData);
        }
      }
    } catch (error) {
      console.error("File upload error:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatus = (tender: Tender) => {
    const now = new Date();
    const closingDate = new Date(tender.closingDate);
    return closingDate > now ? "Open" : "Closed";
  };

  const getStatusColor = (tender: Tender) => {
    const status = getStatus(tender);
    return status === "Open" ? "success" : "error";
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">Failed to load tenders. Please try again.</Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1">
          Tender Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTender}
          disabled={createTenderMutation.isPending}
        >
          Add New Tender
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage tender opportunities, upload documents, and track submission
        deadlines.
      </Typography>

      {/* Live Preview */}
      {/* Live Preview */}
      {tendersData && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              mb: 0.75,
              color: "primary.main",
              fontWeight: 700,
              fontSize: "1.15rem",
            }}
          >
            Live Preview
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            This is how your tenders page appears to visitors.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "#ffffff",
            }}
          >
            {/* =========================================================
          PREVIEW HERO
          ========================================================= */}
            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                px: {
                  xs: 3,
                  sm: 5,
                  md: 7,
                },
                py: {
                  xs: 5,
                  sm: 6,
                  md: 7,
                },
                textAlign: "center",
                background:
                  "linear-gradient(135deg, #064e2a 0%, #08753a 55%, #0b8f49 100%)",
                color: "#ffffff",

                "&::before": {
                  content: '""',
                  position: "absolute",
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  top: -130,
                  right: -70,
                },

                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background: "rgba(250,200,0,0.06)",
                  bottom: -120,
                  left: -70,
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  maxWidth: 760,
                  mx: "auto",
                }}
              >
                <Typography
                  component="h2"
                  sx={{
                    fontSize: {
                      xs: "2rem",
                      sm: "2.5rem",
                      md: "3rem",
                    },
                    lineHeight: 1.15,
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    mb: 2,
                  }}
                >
                  {tendersData.hero.title}
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 680,
                    mx: "auto",
                    color: "rgba(255,255,255,0.86)",
                    fontSize: {
                      xs: "0.95rem",
                      sm: "1rem",
                    },
                    lineHeight: 1.7,
                  }}
                >
                  {tendersData.hero.subtitle}
                </Typography>
              </Box>
            </Box>

            {/* =========================================================
          TENDER CONTENT
          ========================================================= */}
            <Box
              sx={{
                px: {
                  xs: 2,
                  sm: 4,
                  md: 5,
                },
                py: {
                  xs: 4,
                  sm: 5,
                  md: 6,
                },
                bgcolor: "#f8faf9",
              }}
            >
              {/* Section heading */}
              <Box
                sx={{
                  mb: 3,
                  display: "flex",
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },
                  justifyContent: "space-between",
                  gap: 2,
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                }}
              >
                <Box>
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: {
                        xs: "1.4rem",
                        sm: "1.6rem",
                      },
                      fontWeight: 700,
                      color: "#12301f",
                      mb: 0.5,
                    }}
                  >
                    Available Tenders
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Explore current opportunities and submit your bids before
                    the closing date.
                  </Typography>
                </Box>

                <Chip
                  label={`${activePreviewTenders.length} Active`}
                  size="small"
                  sx={{
                    bgcolor: "#e7f6ec",
                    color: "#08652f",
                    fontWeight: 600,
                    border: "1px solid #c7ead3",
                  }}
                />
              </Box>

              {/* =======================================================
            TENDER CARDS
            ======================================================= */}
              {/* =================================================
    TENDER CARDS
    Matches the public website card design
    ================================================= */}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                }}
              >
                {activePreviewTenders.length > 0 ? (
                  paginatedPreviewTenders.map((tender) => (
                    <Box
                      key={tender.id}
                      sx={{
                        borderRadius: 2,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                        p: 3,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                        transition: "box-shadow 0.2s ease",

                        "&:hover": {
                          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.10)",
                        },
                      }}
                    >
                      {/* =================================================
            TITLE / DESCRIPTION
            ================================================= */}

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            component="h3"
                            sx={{
                              fontSize: {
                                xs: "1.15rem",
                                sm: "1.25rem",
                              },
                              lineHeight: 1.4,
                              fontWeight: 600,
                              color: "text.primary",
                              mt: 0.5,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {tender.description}
                          </Typography>
                        </Box>
                      </Box>

                      {/* =================================================
            REFERENCE
            Website:
            Ref: {tender.reference}
            ================================================= */}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2.5,
                          fontSize: "0.875rem",
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                          }}
                        >
                          Ref:
                        </Box>{" "}
                        {tender.tenderNo}
                      </Typography>

                      {/* =================================================
            CLOSING DATE
            Website:
            Closes: {tender.closingDate}
            ================================================= */}

                      <Typography
                        variant="body2"
                        sx={{
                          color: "#dc2626",
                          fontWeight: 500,
                          mb: 2.5,
                          fontSize: "0.875rem",
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          Closes:
                        </Box>{" "}
                        {formatDate(tender.closingDate)}
                      </Typography>

                      {/* =================================================
            DOCUMENT BUTTONS
            Each document gets its own button, matching
            the public website implementation.
            ================================================= */}

                      {tender.documents && tender.documents.length > 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1.5,
                          }}
                        >
                          {tender.documents.map((doc, index) => (
                            <Button
                              key={
                                doc.id ||
                                doc.fileUrl ||
                                `preview-document-${index}`
                              }
                              component="a"
                              href={`${API_BASE}${doc.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              variant="outlined"
                              startIcon={<DescriptionIcon />}
                              sx={{
                                borderRadius: 3,
                                px: 2,
                                py: 1,
                                textTransform: "none",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                borderColor: "divider",
                                color: "primary.main",
                                backgroundColor: "background.default",

                                "&:hover": {
                                  backgroundColor: "primary.main",
                                  color: "#ffffff",
                                  borderColor: "primary.main",
                                },
                              }}
                            >
                              {doc.filename || `Document ${index + 1}`}
                            </Button>
                          ))}
                        </Box>
                      ) : tender.fileUrl ? (
                        /*
                         * Backwards compatibility for tenders that
                         * still use the old single fileUrl field.
                         */
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1.5,
                          }}
                        >
                          <Button
                            component="a"
                            href={`${API_BASE}${tender.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            variant="outlined"
                            startIcon={<DescriptionIcon />}
                            sx={{
                              borderRadius: 3,
                              px: 2,
                              py: 1,
                              textTransform: "none",
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              borderColor: "divider",
                              color: "primary.main",
                              backgroundColor: "background.default",

                              "&:hover": {
                                backgroundColor: "primary.main",
                                color: "#ffffff",
                                borderColor: "primary.main",
                              },
                            }}
                          >
                            Tender Document
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          No documents available
                        </Typography>
                      )}
                    </Box>
                  ))
                ) : (
                  <Box
                    sx={{
                      py: 7,
                      px: 3,
                      textAlign: "center",
                      bgcolor: "#ffffff",
                      border: "1px dashed",
                      borderColor: "#cfdad2",
                      borderRadius: 2.5,
                    }}
                  >
                    <AssignmentIcon
                      sx={{
                        fontSize: 42,
                        color: "text.disabled",
                        mb: 1,
                      }}
                    />

                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        mb: 0.5,
                      }}
                    >
                      No tenders available
                    </Typography>

                    <Typography variant="body2" color="text.disabled">
                      There are currently no active tender opportunities.
                    </Typography>
                  </Box>
                )}
              </Box>
              {activePreviewTenders.length > PREVIEW_ITEMS_PER_PAGE && (
                <Box
                  sx={{
                    mt: 4,
                    display: "flex",
                    flexDirection: {
                      xs: "column",
                      sm: "row",
                    },
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textAlign: {
                        xs: "center",
                        sm: "left",
                      },
                    }}
                  >
                    Showing {(previewPage - 1) * PREVIEW_ITEMS_PER_PAGE + 1}–
                    {Math.min(
                      previewPage * PREVIEW_ITEMS_PER_PAGE,
                      activePreviewTenders.length
                    )}{" "}
                    of {activePreviewTenders.length} active tenders
                  </Typography>

                  <Pagination
                    count={previewPageCount}
                    page={previewPage}
                    onChange={(_, page) => setPreviewPage(page)}
                    color="primary"
                    shape="rounded"
                    size="small"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Hero Section Management */}
      {tendersData && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Hero Section Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hero Title"
                  value={tendersData.hero.title}
                  onChange={(e) => {
                    const updatedData = {
                      ...tendersData,
                      hero: { ...tendersData.hero, title: e.target.value },
                    };
                    setTendersData(updatedData);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hero Subtitle"
                  value={tendersData.hero.subtitle}
                  onChange={(e) => {
                    const updatedData = {
                      ...tendersData,
                      hero: { ...tendersData.hero, subtitle: e.target.value },
                    };
                    setTendersData(updatedData);
                  }}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={() => updateTendersMutation.mutate(tendersData)}
                  disabled={updateTendersMutation.isPending}
                  startIcon={<SaveIcon />}
                >
                  {updateTendersMutation.isPending
                    ? "Saving..."
                    : "Save Hero Settings"}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tenders Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tender No</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Closing Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tendersData?.tenders.map((tender, idx) => (
              <TableRow key={tender.id || `tender-row-${idx}`}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {tender.tenderNo}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {tender.description}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(tender.startDate)}</TableCell>
                <TableCell>{formatDate(tender.closingDate)}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatus(tender)}
                    color={getStatusColor(tender)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {tender.documents && tender.documents.length > 0 ? (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {tender.documents.map((doc, docIndex) => (
                        <IconButton
                          key={doc.id || doc.fileUrl || `doc-${docIndex}`}
                          size="small"
                          onClick={() =>
                            window.open(`${API_BASE}${doc.fileUrl}`, "_blank")
                          }
                          title={doc.filename || "View Document"}
                        >
                          <ViewIcon />
                        </IconButton>
                      ))}
                      <Typography variant="body2" color="text.secondary">
                        {tender.documents.length} docs
                      </Typography>
                    </Box>
                  ) : tender.fileUrl ? (
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(`${API_BASE}${tender.fileUrl}`, "_blank")
                        }
                        title="View File"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = `${API_BASE}${tender.fileUrl}`;
                          link.download = `tender-${tender.tenderNo}.pdf`;
                          link.click();
                        }}
                        title="Download File"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No file
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tender.isActive}
                        onChange={() => handleToggleTender(tender)}
                        disabled={updateTenderMutation.isPending}
                        color="primary"
                      />
                    }
                    label={tender.isActive ? "Active" : "Inactive"}
                    labelPlacement="end"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditTender(tender)}
                    disabled={updateTenderMutation.isPending}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTender(tender.id)}
                    color="error"
                    disabled={deleteTenderMutation.isPending}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {tendersData?.tenders.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <AssignmentIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Tenders Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Start by adding your first tender opportunity.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTender}
            >
              Add First Tender
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Tender Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTender?.id ? "Edit Tender" : "Add New Tender"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tender Number"
                value={editingTender?.tenderNo || ""}
                onChange={(e) =>
                  setEditingTender({
                    ...editingTender!,
                    tenderNo: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={editingTender?.startDate || ""}
                onChange={(e) =>
                  setEditingTender({
                    ...editingTender!,
                    startDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Closing Date"
                type="date"
                value={editingTender?.closingDate || ""}
                onChange={(e) =>
                  setEditingTender({
                    ...editingTender!,
                    closingDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingTender?.isActive || false}
                    onChange={(e) =>
                      setEditingTender({
                        ...editingTender!,
                        isActive: e.target.checked,
                      })
                    }
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editingTender?.description || ""}
                onChange={(e) =>
                  setEditingTender({
                    ...editingTender!,
                    description: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Tender Documents
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? "Uploading..." : "Upload Documents"}
                  </Button>
                </label>
              </Box>
              {pendingFiles.length > 0 && (
                <Box mt={2} display="flex" flexDirection="column" gap={1}>
                  <Typography variant="caption" color="text.secondary">
                    These will upload automatically once the tender is created:
                  </Typography>
                  {pendingFiles.map((file, index) => (
                    <Box
                      key={`pending-${file.name}-${index}`}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <DescriptionIcon color="disabled" />
                      <Typography variant="body2" color="text.secondary">
                        {file.name}
                      </Typography>
                      <Chip
                        label="Pending"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                      <IconButton
                        size="small"
                        color="error"
                        title="Remove this file"
                        onClick={() =>
                          setPendingFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              {editingTender?.documents?.length || editingTender?.fileUrl ? (
                <Box mt={2} display="flex" flexDirection="column" gap={1}>
                  {editingTender.documents?.map((doc, docIndex) => (
                    <Box
                      key={doc.id || doc.fileUrl || `doc-${docIndex}`}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <DescriptionIcon color="primary" />
                      <Typography variant="body2">
                        {doc.filename || "Document"}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(`${API_BASE}${doc.fileUrl}`, "_blank")
                        }
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = `${API_BASE}${doc.fileUrl}`;
                          link.download = doc.filename || "tender-document";
                          link.click();
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="Remove this document"
                        onClick={() =>
                          doc.id && removeDocumentMutation.mutate(doc.id)
                        }
                        disabled={removeDocumentMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {!editingTender.documents?.length &&
                    editingTender.fileUrl && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <DescriptionIcon color="primary" />
                        <Typography variant="body2" color="primary">
                          Document uploaded
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            window.open(
                              `${API_BASE}${editingTender.fileUrl}`,
                              "_blank"
                            )
                          }
                        >
                          <ViewIcon />
                        </IconButton>
                      </Box>
                    )}
                </Box>
              ) : null}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsDialogOpen(false);
              setPendingFiles([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTender}
            variant="contained"
            disabled={
              createTenderMutation.isPending ||
              updateTenderMutation.isPending ||
              uploadingFile
            }
          >
            {createTenderMutation.isPending ||
            updateTenderMutation.isPending ||
            uploadingFile ? (
              <CircularProgress size={20} />
            ) : editingTender?.id ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this tender? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteTender}
            color="error"
            variant="contained"
            disabled={deleteTenderMutation.isPending}
          >
            {deleteTenderMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TenderEditor;
