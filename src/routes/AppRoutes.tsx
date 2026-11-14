import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { useAuthStore } from '../stores/authStore';

// Features
import { LoginPage } from '../features/auth/LoginPage';
import { ProfilePage } from '../features/auth/ProfilePage';
import { AdminDashboard } from '../features/dashboard/AdminDashboard';
import { PlayerDashboard } from '../features/dashboard/PlayerDashboard';
import { CafePosPage } from '../features/pos/CafePosPage';
import { TourListPage } from '../features/poker-tours/TourListPage';
import { TournamentClockPage } from '../features/poker-tours/TournamentClockPage';
import { BlindStructurePage } from '../features/poker-tours/BlindStructurePage';
import { PointsManagementPage } from '../features/player-points/PointsManagementPage';
import { LeaderboardView } from '../features/player-points/LeaderboardView';
import { AccountListPage } from '../features/accounts/AccountListPage';
import { RoleMatrixPage } from '../features/permissions/RoleMatrixPage';
import { ShiftListPage } from '../features/shifts/ShiftListPage';
import { ActiveShiftPage } from '../features/shifts/ActiveShiftPage';
import { RevenueReportPage } from '../features/reports/RevenueReportPage';

export const AppRoutes: React.FC = () => {
  const { currentUser } = useAuthStore();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard Home - Role-based default */}
        <Route
          index
          element={
            currentUser?.role === 'PLAYER' ? (
              <PlayerDashboard />
            ) : (
              <AdminDashboard />
            )
          }
        />

        {/* Player Portal */}
        <Route path="player/portal" element={<PlayerDashboard />} />

        {/* Module 4: Cafe POS */}
        <Route
          path="pos"
          element={
            <ProtectedRoute requiredPermission="POS_ORDER">
              <CafePosPage />
            </ProtectedRoute>
          }
        />

        {/* Module 6: Poker Tour & Clock */}
        <Route path="tours" element={<TourListPage />} />
        <Route path="tours/clock" element={<TournamentClockPage />} />
        <Route path="tours/clock/:id" element={<TournamentClockPage />} />
        <Route
          path="tours/blind-structures"
          element={
            <ProtectedRoute requiredPermission="TOUR_MANAGE">
              <BlindStructurePage />
            </ProtectedRoute>
          }
        />

        {/* Module 5: Player Points & Leaderboard */}
        <Route path="points" element={<PointsManagementPage />} />
        <Route path="leaderboard" element={<LeaderboardView />} />

        {/* Module 3: Account Management */}
        <Route
          path="accounts"
          element={
            <ProtectedRoute requiredPermission="ACCOUNT_VIEW">
              <AccountListPage />
            </ProtectedRoute>
          }
        />

        {/* Module 2: Role & Permission Management */}
        <Route
          path="permissions"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <RoleMatrixPage />
            </ProtectedRoute>
          }
        />

        {/* Module 7: Shift Management */}
        <Route
          path="shifts"
          element={
            <ProtectedRoute requiredPermission="SHIFT_VIEW">
              <ShiftListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shifts/active"
          element={
            <ProtectedRoute requiredPermission="SHIFT_VIEW">
              <ActiveShiftPage />
            </ProtectedRoute>
          }
        />

        {/* Module 8: Revenue Reporting */}
        <Route
          path="reports"
          element={
            <ProtectedRoute requiredPermission="REPORT_VIEW">
              <RevenueReportPage />
            </ProtectedRoute>
          }
        />

        {/* Module 1: Profile & Password */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

