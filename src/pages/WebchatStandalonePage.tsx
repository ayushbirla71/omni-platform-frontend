import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { WebchatWidget } from '../components/webchat/WebchatWidget';

export const WebchatStandalonePage: React.FC = () => {
  const { widgetKey } = useParams<{ widgetKey: string }>();
  const [searchParams] = useSearchParams();

  // Check if loaded inside an iframe (embed mode) or standalone full-window
  const isEmbedded =
    searchParams.get('embedded') === 'true' ||
    searchParams.get('embed') === 'true' ||
    (typeof window !== 'undefined' && window.self !== window.top);

  if (!widgetKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-sm">
          <p className="text-slate-800 font-semibold mb-1">Invalid Widget Key</p>
          <p className="text-xs text-slate-500">
            Please provide a valid webchat widget key in the URL.
          </p>
        </div>
      </div>
    );
  }

  // If embedded in iframe or embed mode, render interactive floating widget with auto-resizing
  if (isEmbedded) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-transparent">
        <WebchatWidget widgetKey={widgetKey} mode="floating" />
      </div>
    );
  }

  // Standalone desktop/mobile full window view with clean background
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/30 p-2 sm:p-6 font-sans">
      <div className="w-full max-w-md h-[95vh] sm:h-[680px] shadow-2xl rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
        <WebchatWidget widgetKey={widgetKey} mode="standalone" className="h-full" />
      </div>
    </div>
  );
};

export default WebchatStandalonePage;
