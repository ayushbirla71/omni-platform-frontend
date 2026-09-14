import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { DialogProvider } from './context/DialogContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { InboxPage } from './pages/InboxPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { FlowsPage } from './pages/FlowsPage';
import { FlowEditorPage } from './pages/FlowEditorPage';
import { ContactsPage } from './pages/ContactsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailsPage } from './pages/CampaignDetailsPage';
import { NewCampaignPage } from './pages/NewCampaignPage';
import { DealsPage } from './pages/DealsPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { SearchPage } from './pages/SearchPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportTicketsPage } from './pages/SupportTicketsPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { DataDeletionPage } from './pages/DataDeletionPage';
import { WebchatStandalonePage } from './pages/WebchatStandalonePage';
import { Spinner } from './components/common/Tabs';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <DialogProvider>
              <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />

            {/* Public Legal & Compliance Routes (Unauthenticated for Meta App Review & Direct Manual Access) */}
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/terms-of-service" element={<TermsPage />} />
            <Route path="/data-deletion" element={<DataDeletionPage />} />
            <Route path="/data-deletion-instructions" element={<DataDeletionPage />} />
            <Route path="/docs" element={<DocumentationPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/guide" element={<DocumentationPage />} />
            <Route path="/manual" element={<DocumentationPage />} />

            {/* Public Live Webchat Standalone Route */}
            <Route path="/chat/:widgetKey" element={<WebchatStandalonePage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="flows" element={<FlowsPage />} />
              <Route path="flows/:id" element={<FlowEditorPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/new" element={<NewCampaignPage />} />
              <Route path="campaigns/:id" element={<CampaignDetailsPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="knowledge-bases" element={<KnowledgeBasePage />} />
              <Route path="docs" element={<DocumentationPage />} />
              <Route path="documentation" element={<DocumentationPage />} />
              <Route path="guide" element={<DocumentationPage />} />
              <Route path="manual" element={<DocumentationPage />} />
              <Route path="support" element={<SupportTicketsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
            </DialogProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
  );
}

export default App;
