import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Dashboard data: real queries against endpoints that actually exist. An
// earlier version of this hook queried /api/pages (a route that was never
// mounted, since the generic page builder it belonged to was superseded by
// dedicated editors for every content type) and simulated a "system health"
// panel with Math.random() rather than real data. Both are replaced here
// with real signals: the actual API health check, and content counts drawn
// from the same endpoints their own editor pages use.
export const useDashboardData = () => {
  const mediaQuery = useQuery({
    queryKey: ['media-files'],
    queryFn: async () => {
      const response = await axios.get('/api/media/files');
      return response.data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const boardQuery = useQuery({
    queryKey: ['board-members'],
    queryFn: async () => {
      const response = await axios.get('/api/board-members');
      return response.data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const teamQuery = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const response = await axios.get('/api/team');
      return response.data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const tendersQuery = useQuery({
    queryKey: ['tenders'],
    queryFn: async () => {
      const response = await axios.get('/api/tenders/tenders');
      return response.data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const noticesQuery = useQuery({
    queryKey: ['notices-admin'],
    queryFn: async () => {
      const response = await axios.get('/api/notices/admin');
      return response.data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const branchesQuery = useQuery({
    queryKey: ['branch-locations-admin'],
    queryFn: async () => {
      const response = await axios.get('/api/branch-locations/admin');
      return response.data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const healthQuery = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await axios.get('/api/health');
      return response.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 1,
  });

  const stats = {
    totalMediaFiles: Array.isArray(mediaQuery.data) ? mediaQuery.data.length : 0,
    totalBoardMembers: Array.isArray(boardQuery.data) ? boardQuery.data.length : 0,
    totalTeamMembers: Array.isArray(teamQuery.data) ? teamQuery.data.length : 0,
    activeTenders: Array.isArray(tendersQuery.data)
      ? tendersQuery.data.filter((t: any) => t.isActive !== false).length
      : 0,
    totalNotices: Array.isArray(noticesQuery.data?.notices) ? noticesQuery.data.notices.length : 0,
    totalBranches: Array.isArray(branchesQuery.data?.branches) ? branchesQuery.data.branches.length : 0,
  };

  const recentActivity = {
    media: Array.isArray(mediaQuery.data)
      ? [...mediaQuery.data]
          .sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, 5)
      : [],
    tenders: Array.isArray(tendersQuery.data)
      ? [...tendersQuery.data]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      : [],
  };

  const isLoading =
    mediaQuery.isLoading || boardQuery.isLoading || teamQuery.isLoading ||
    tendersQuery.isLoading || noticesQuery.isLoading || branchesQuery.isLoading;

  const hasError =
    mediaQuery.error || boardQuery.error || teamQuery.error ||
    tendersQuery.error || noticesQuery.error || branchesQuery.error;

  const refreshAll = async () => {
    await Promise.all([
      mediaQuery.refetch(),
      boardQuery.refetch(),
      teamQuery.refetch(),
      tendersQuery.refetch(),
      noticesQuery.refetch(),
      branchesQuery.refetch(),
      healthQuery.refetch(),
    ]);
  };

  return {
    mediaFiles: mediaQuery.data,
    boardMembers: boardQuery.data,
    teamMembers: teamQuery.data,
    tenders: tendersQuery.data,
    apiHealth: healthQuery.data,
    isHealthy: !healthQuery.isError && healthQuery.data?.status === 'OK',
    stats,
    recentActivity,
    isLoading,
    hasError,
    queries: {
      media: mediaQuery,
      board: boardQuery,
      team: teamQuery,
      tenders: tendersQuery,
      notices: noticesQuery,
      branches: branchesQuery,
      health: healthQuery,
    },
    refreshAll,
  };
};
