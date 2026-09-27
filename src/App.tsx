/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/layout/LandingPage';
import Workspace from './components/workspace/Workspace';
import IsolatedPreviewPage from './components/preview/IsolatedPreviewPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Engrenagem AI — Falha Recuperada">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/preview/:id" element={<IsolatedPreviewPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
