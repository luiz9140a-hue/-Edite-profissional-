/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/layout/LandingPage';
import Workspace from './components/workspace/Workspace';
import IsolatedPreviewPage from './components/preview/IsolatedPreviewPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import LoginPage from './auth/LoginPage';
import RequireAuth from './auth/RequireAuth';
import BeginnerLeadCoach from './components/beginner/BeginnerLeadCoach';
import BuilderPage from './components/builder/BuilderPage';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Engrenagem AI — Falha Recuperada">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/workspace" element={<RequireAuth><Workspace /></RequireAuth>} />
        <Route path="/beginner" element={<RequireAuth><BeginnerLeadCoach /></RequireAuth>} />
        <Route path="/builder" element={<RequireAuth><BuilderPage /></RequireAuth>} />
        <Route path="/preview/:id" element={<RequireAuth><IsolatedPreviewPage /></RequireAuth>} />
      </Routes>
    </ErrorBoundary>
  );
}
