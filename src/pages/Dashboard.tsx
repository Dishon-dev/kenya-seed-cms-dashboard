import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  PhotoLibrary as MediaIcon,
  Groups as BoardIcon,
  Group as TeamIcon,
  Gavel as TenderIcon,
  Campaign as NoticeIcon,
  LocationOn as BranchIcon,
  ArrowForward as ArrowIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { useAuth } from '../utils/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';

const statCards = [
  { key: 'totalMediaFiles', label: 'Media Files', icon: MediaIcon, path: '/media' },
  { key: 'totalBoardMembers', label: 'Board Members', icon: BoardIcon, path: '/board-members' },
  { key: 'totalTeamMembers', label: 'Team Members', icon: TeamIcon, path: '/team-management' },
  { key: 'activeTenders', label: 'Active Tenders', icon: TenderIcon, path: '/tenders' },
  { key: 'totalNotices', label: 'Notices', icon: NoticeIcon, path: '/notices' },
  { key: 'totalBranches', label: 'Branch Locations', icon: BranchIcon, path: '/branch-locations' },
] as const;

const quickLinks = [
  { label: 'Edit hero section', path: '/hero-editor' },
  { label: 'Add a notice', path: '/notices' },
  { label: 'Manage products', path: '/products' },
  { label: 'Review applications', path: '/application-forms-management' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, recentActivity, isLoading, isHealthy, refreshAll } = useDashboardData();

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <Box sx={{ px: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4">Welcome back, {firstName}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Here is what is happening across the site right now.
          </Typography>
        </Box>
        <Chip
          size="small"
          icon={<DotIcon sx={{ fontSize: 10 }} />}
          label={isHealthy ? 'All systems operational' : 'Connection issue'}
          color={isHealthy ? 'success' : 'error'}
          variant="outlined"
          sx={{ '& .MuiChip-icon': { color: isHealthy ? 'success.main' : 'error.main' } }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {statCards.map(({ key, label, icon: Icon, path }) => (
              <Grid item xs={6} sm={4} md={2} key={key}>
                <Card
                  onClick={() => navigate(path)}
                  sx={{ cursor: 'pointer', height: '100%', '&:hover': { borderColor: 'primary.main' } }}
                >
                  <CardContent sx={{ p: 2.25 }}>
                    <Icon sx={{ fontSize: 20, color: 'text.secondary', mb: 1.5 }} />
                    <Typography variant="h3" sx={{ fontSize: '1.5rem', lineHeight: 1 }}>
                      {stats[key]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8125rem' }}>
                      {label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Recent activity</Typography>
                  <Button size="small" onClick={() => refreshAll()}>Refresh</Button>
                </Box>

                {recentActivity.media.length === 0 && recentActivity.tenders.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Nothing to show yet.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {recentActivity.media.slice(0, 3).map((item: any, i: number) => (
                      <React.Fragment key={`media-${i}`}>
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <MediaIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.originalName || item.filename || 'Uploaded file'}
                            secondary="Media file"
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                    {recentActivity.tenders.slice(0, 3).map((item: any, i: number) => (
                      <React.Fragment key={`tender-${i}`}>
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <TenderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.description || item.tenderNo || 'Tender'}
                            secondary="Tender"
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500, noWrap: true }}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Quick links</Typography>
                <List disablePadding>
                  {quickLinks.map((link) => (
                    <ListItem key={link.path} disablePadding sx={{ mb: 0.5 }}>
                      <Button
                        fullWidth
                        onClick={() => navigate(link.path)}
                        endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          justifyContent: 'space-between',
                          color: 'text.primary',
                          fontWeight: 500,
                          py: 1,
                          px: 1.5,
                          '&:hover': { backgroundColor: '#f0f1f3' },
                        }}
                      >
                        {link.label}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
